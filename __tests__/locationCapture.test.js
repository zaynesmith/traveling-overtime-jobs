import { captureCurrentLocation, LOCATION_CAPTURE_STATUS } from "../lib/utils/locationCapture";

describe("captureCurrentLocation", () => {
  afterEach(() => {
    delete global.window;
  });

  it("returns not_supported when geolocation is missing", async () => {
    global.window = {};
    const result = await captureCurrentLocation();
    expect(result.status).toBe(LOCATION_CAPTURE_STATUS.NOT_SUPPORTED);
    expect(result.latitude).toBeNull();
    expect(result.longitude).toBeNull();
    expect(result.accuracy).toBeNull();
  });

  it("returns coordinates and accuracy when available", async () => {
    global.window = {
      navigator: {
        geolocation: {
          getCurrentPosition: (success) => {
            success({ coords: { latitude: 30.2672, longitude: -97.7431, accuracy: 12 } });
          },
        },
      },
    };

    const result = await captureCurrentLocation();
    expect(result).toEqual({
      status: LOCATION_CAPTURE_STATUS.AVAILABLE,
      latitude: 30.2672,
      longitude: -97.7431,
      accuracy: 12,
      message: "",
    });
  });

  it("maps permission denied errors", async () => {
    global.window = {
      navigator: {
        geolocation: {
          getCurrentPosition: (_success, error) => {
            error({ code: 1 });
          },
        },
      },
    };

    const result = await captureCurrentLocation();
    expect(result.status).toBe(LOCATION_CAPTURE_STATUS.PERMISSION_DENIED);
    expect(result.message).toBe("Location permission required");
  });

  it("maps timeout errors", async () => {
    global.window = {
      navigator: {
        geolocation: {
          getCurrentPosition: (_success, error) => {
            error({ code: 3 });
          },
        },
      },
    };

    const result = await captureCurrentLocation();
    expect(result.status).toBe(LOCATION_CAPTURE_STATUS.TIMEOUT);
    expect(result.message).toBe("Location timeout. Please retry.");
  });
});
