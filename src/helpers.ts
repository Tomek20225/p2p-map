export function calculateCameraZ(WIDTH: number, HEIGHT: number, mapWidth: number, mapHeight: number): number {
    const magicNumber = 750; // calculated empirically
    const defaultZ = 5;

    const zBasedOnWidth = Math.round((mapWidth * magicNumber) / WIDTH) + 1;
    const zBasedOnHeight = Math.round((mapHeight * magicNumber) / HEIGHT) + 1;

    return Math.max(zBasedOnWidth, zBasedOnHeight, defaultZ);
}
