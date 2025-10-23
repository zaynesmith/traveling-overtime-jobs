import zipcodes from "zipcodes";

export function getZipsWithinRadius(originZip, miles) {
  if (!originZip || !miles) return [];
  const nearby = zipcodes.radius(originZip, miles);
  return nearby || [];
}
