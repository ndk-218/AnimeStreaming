import Header from '../components/public/Header';
import HeroSlider from '../components/public/HeroSlider';
import RecentEpisodesSlider from '../components/public/RecentEpisodesSlider';
import TrendingEpisodesSlider from '../components/public/TrendingEpisodesSlider';
import TopGenres from '../components/public/TopGenres';
import TopSeasons from '../components/public/TopSeasons';
import GenreTrending from '../components/public/GenreTrending';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Slider Section - No box, full width */}
      <HeroSlider />
      
      {/* Main Content Section - Rankings (Left) + Episodes (Right) */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-[1700px] mx-auto px-6">
          <div className="flex gap-6">
            {/* Left Side - Rankings (Fixed width ~300px) */}
            <div className="w-[300px] flex-shrink-0 flex flex-col gap-6">
              {/* Top Genres Ranking */}
              <TopGenres />
              
              {/* Top Seasons Ranking */}
              <TopSeasons />
            </div>

            {/* Right Side - Episodes Lists (Flex grow to fill remaining space) */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Recent Episodes Box */}
              <div className="bg-white rounded-lg p-6 shadow-sm border-2 border-blue-300">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Tập Phim Mới Nhất</h2>
                </div>
                <RecentEpisodesSlider />
              </div>

              {/* Trending Episodes Box */}
              <div className="bg-white rounded-lg px-6 py-8 shadow-sm border-2 border-red-300">
                <div className="mb-6 flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">Anime Thịnh Hành</h2>
                  <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold rounded-full animate-pulse">
                    🔥 HOT
                  </span>
                </div>
                <TrendingEpisodesSlider />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Genre Trending Section - Full width box */}
      <section className="pb-12 bg-gray-50">
        <div className="max-w-[1700px] mx-auto px-6">
          <GenreTrending />
        </div>
      </section>
    </div>
  );
};

export default HomePage;
