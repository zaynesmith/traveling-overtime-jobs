const LOCATION_TIMEOUT_MS = 10_000;

export const LOCATION_CAPTURE_STATUS = {
  CAPTURING: "capturing",
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
  PERMISSION_DENIED: "permission_denied",
  TIMEOUT: "timeout",
  NOT_SUPPORTED: "not_supported",
};

function buildUnavailableResult(status, message) {
  return {
    status,
    latitude: null,
    longitude: null,
    accuracy: null,
    message,
  };
}

export async function captureCurrentLocation() {
  if (typeof window === "undefined" || !window.navigator?.geolocation) {
    return buildUnavailableResult(
      LOCATION_CAPTURE_STATUS.NOT_SUPPORTED,
      "Location is unavailable on this device."
    );
  }

  return new Promise((resolve) => {
    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          status: LOCATION_CAPTURE_STATUS.AVAILABLE,
          latitude: position.coords?.latitude ?? null,
          longitude: position.coords?.longitude ?? null,
          accuracy: position.coords?.accuracy ?? null,
          message: "",
        });
      },
      (error) => {
        if (error?.code === 1) {
          resolve(
            buildUnavailableResult(
              LOCATION_CAPTURE_STATUS.PERMISSION_DENIED,
              "Location permission required"
            )
          );
          return;
        }

        if (error?.code === 3) {
          resolve(
            buildUnavailableResult(
              LOCATION_CAPTURE_STATUS.TIMEOUT,
              "Location timeout. Please retry."
            )
          );
          return;
        }

        resolve(
          buildUnavailableResult(
            LOCATION_CAPTURE_STATUS.UNAVAILABLE,
            "Unable to capture location from GPS."
          )
        );
      },
      {
        enableHighAccuracy: true,
        timeout: LOCATION_TIMEOUT_MS,
        maximumAge: 0,
      }
    );
  });
}
