// @ts-nocheck
require('dotenv').config();
const { connectDatabase } = require('./src/models');
const EpisodeService = require('./src/services/episode.service');

async function createTestEpisode() {
  try {
    console.log('Creating test episode without video file...');
    
    await connectDatabase(process.env.MONGODB_URI);
    
    const episodeData = {
      seriesId: "68aeda2eab7bbe6ae9edd63e", // Jujutsu Kaisen series ID
      seasonId: "68aedca2ab7bbe6ae9edd649", // Season 1 ID
      episodeNumber: 1,
      title: "Ryomen Sukuna",
      description: "Yuji Itadori, a high school student, joins his school's Occult Club for fun, but discovers that its members are actual sorcerers who can manipulate cursed energy."
    };

    const episode = await EpisodeService.createEpisode(episodeData);

    console.log('Episode created successfully:');
    console.log(`ID: ${episode._id}`);
    console.log(`Title: ${episode.title}`);
    console.log(`Episode Number: ${episode.episodeNumber}`);
    console.log(`Status: ${episode.processingStatus}`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('Failed to create test episode:', error.message);
    process.exit(1);
  }
}

createTestEpisode();
