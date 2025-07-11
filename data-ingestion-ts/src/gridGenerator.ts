import { GridPoint } from './models/types';

/**
 * Generate a grid of points covering the Earth with the specified precision.
 * 
 * @param precisionKm The distance between adjacent points in kilometers.
 * @returns A list of objects containing latitude, longitude, and a generated name for each point.
 */
export function generateEarthGrid(precisionKm: number = 5): GridPoint[] {
  // Earth's radius in kilometers
  const earthRadius = 6371.0;
  
  // Calculate the number of points needed along the equator
  const equatorCircumference = 2 * Math.PI * earthRadius;
  const numPointsEquator = Math.floor(equatorCircumference / precisionKm);
  
  // Calculate the number of latitude bands needed
  const numLatBands = Math.floor(Math.PI * earthRadius / precisionKm);
  
  // Initialize the grid
  const gridPoints: GridPoint[] = [];
  
  // Generate points for each latitude band
  for (let i = 0; i < numLatBands; i++) {
    // Calculate the latitude (in radians)
    const latRad = (Math.PI / numLatBands) * i - (Math.PI / 2);
    const latDeg = latRad * (180 / Math.PI);
    
    // Calculate the radius of this latitude circle
    const circleRadius = earthRadius * Math.cos(latRad);
    
    // Calculate the circumference of this latitude circle
    const circleCircumference = 2 * Math.PI * circleRadius;
    
    // Calculate the number of points needed for this latitude
    const numPoints = Math.max(1, Math.floor(circleCircumference / precisionKm));
    
    // Generate points around this latitude
    for (let j = 0; j < numPoints; j++) {
      // Calculate the longitude (in radians)
      const lonRad = (2 * Math.PI / numPoints) * j;
      let lonDeg = lonRad * (180 / Math.PI);
      
      // Normalize longitude to -180 to 180
      if (lonDeg > 180) {
        lonDeg -= 360;
      }
      
      // Generate a name for this point
      const pointName = `Grid-${latDeg.toFixed(2)}-${lonDeg.toFixed(2)}`;
      
      // Add the point to the grid
      gridPoints.push({
        name: pointName,
        lat: latDeg,
        lon: lonDeg,
        country_code: "N/A"  // We don't have country information for all points
      });
    }
  }
  
  return gridPoints;
}

/**
 * Generate a reduced grid of points covering the Earth with the specified precision.
 * This function limits the number of points to a manageable amount for testing.
 * 
 * @param precisionKm The distance between adjacent points in kilometers.
 * @param maxPoints Maximum number of points to generate.
 * @returns A list of objects containing latitude, longitude, and a generated name for each point.
 */
export function generateReducedGrid(precisionKm: number = 5, maxPoints: number = 1000): GridPoint[] {
  // Generate a full grid
  const fullGrid = generateEarthGrid(precisionKm);
  
  // If the full grid has fewer points than maxPoints, return it
  if (fullGrid.length <= maxPoints) {
    return fullGrid;
  }
  
  // Otherwise, sample maxPoints from the full grid
  const reducedGrid: GridPoint[] = [];
  const step = fullGrid.length / maxPoints;
  
  for (let i = 0; i < maxPoints; i++) {
    const index = Math.floor(i * step);
    reducedGrid.push(fullGrid[index]);
  }
  
  return reducedGrid;
}

// Example usage if this file is run directly
if (import.meta.main) {
  const grid = generateReducedGrid(5, 1000);
  console.log(`Generated ${grid.length} grid points`);
  console.log(`First few points:`, grid.slice(0, 5));
}