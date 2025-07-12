/**
 * Test script for the DataController
 * 
 * This script tests the getDataByLatLon endpoint with sample coordinates
 * and logs the response.
 * 
 * Run with: bun run backend/src/tests/testDataController.ts
 */

import axios from 'axios';

// Sample coordinates (New York City)
const lat = 40.7128;
const lon = -74.0060;

// API endpoint
const apiUrl = 'http://localhost:3000/api/data';

async function testDataController() {
  try {
    console.log(`Testing getDataByLatLon with coordinates: ${lat}, ${lon}`);
    
    const response = await axios.get(apiUrl, {
      params: {
        lat,
        lon
      }
    });

    console.log('Response status:', response.status);
    console.log('Response data:');
    
    // Log location info
    console.log('Location:', response.data.location.name);
    
    // Log news
    console.log('\nNews articles:');
    if (response.data.news && response.data.news.length > 0) {
      response.data.news.forEach((article: any, index: number) => {
        console.log(`${index + 1}. ${article.title}`);
      });
    } else {
      console.log('No news articles found');
    }
    
    // Log historic data
    console.log('\nHistoric data:');
    if (response.data.historicData) {
      console.log('Title:', response.data.historicData.title);
      console.log('Extract:', response.data.historicData.extract.substring(0, 150) + '...');
      console.log('URL:', response.data.historicData.url);
    } else {
      console.log('No historic data found');
    }

  } catch (error) {
    console.error('Error testing DataController:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testDataController();