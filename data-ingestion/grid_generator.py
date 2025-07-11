import math
import numpy as np

def generate_earth_grid(precision_km=5):
    """
    Generate a grid of points covering the Earth with the specified precision.
    
    Args:
        precision_km (float): The distance between adjacent points in kilometers.
        
    Returns:
        list: A list of dictionaries containing latitude, longitude, and a generated name for each point.
    """
    # Earth's radius in kilometers
    earth_radius = 6371.0
    
    # Calculate the number of points needed along the equator
    equator_circumference = 2 * math.pi * earth_radius
    num_points_equator = int(equator_circumference / precision_km)
    
    # Calculate the number of latitude bands needed
    num_lat_bands = int(math.pi * earth_radius / precision_km)
    
    # Initialize the grid
    grid_points = []
    
    # Generate points for each latitude band
    for i in range(num_lat_bands):
        # Calculate the latitude (in radians)
        lat_rad = (math.pi / num_lat_bands) * i - (math.pi / 2)
        lat_deg = math.degrees(lat_rad)
        
        # Calculate the radius of this latitude circle
        circle_radius = earth_radius * math.cos(lat_rad)
        
        # Calculate the circumference of this latitude circle
        circle_circumference = 2 * math.pi * circle_radius
        
        # Calculate the number of points needed for this latitude
        num_points = max(1, int(circle_circumference / precision_km))
        
        # Generate points around this latitude
        for j in range(num_points):
            # Calculate the longitude (in radians)
            lon_rad = (2 * math.pi / num_points) * j
            lon_deg = math.degrees(lon_rad)
            
            # Normalize longitude to -180 to 180
            if lon_deg > 180:
                lon_deg -= 360
            
            # Generate a name for this point
            point_name = f"Grid-{lat_deg:.2f}-{lon_deg:.2f}"
            
            # Add the point to the grid
            grid_points.append({
                "name": point_name,
                "lat": lat_deg,
                "lon": lon_deg,
                "country_code": "N/A"  # We don't have country information for all points
            })
    
    return grid_points

def generate_reduced_grid(precision_km=5, max_points=1000):
    """
    Generate a reduced grid of points covering the Earth with the specified precision.
    This function limits the number of points to a manageable amount for testing.
    
    Args:
        precision_km (float): The distance between adjacent points in kilometers.
        max_points (int): Maximum number of points to generate.
        
    Returns:
        list: A list of dictionaries containing latitude, longitude, and a generated name for each point.
    """
    # Generate a full grid
    full_grid = generate_earth_grid(precision_km)
    
    # If the full grid has fewer points than max_points, return it
    if len(full_grid) <= max_points:
        return full_grid
    
    # Otherwise, sample max_points from the full grid
    indices = np.linspace(0, len(full_grid) - 1, max_points, dtype=int)
    reduced_grid = [full_grid[i] for i in indices]
    
    return reduced_grid

if __name__ == "__main__":
    # Example usage
    grid = generate_reduced_grid(precision_km=5, max_points=1000)
    print(f"Generated {len(grid)} grid points")
    print(f"First few points: {grid[:5]}")