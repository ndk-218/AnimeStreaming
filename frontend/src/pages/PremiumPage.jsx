import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/public/Header';

/**
 * Premium Page - Trang đăng ký Premium
 * TODO: Implement premium subscription features
 */
const PremiumPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" 
                />
              </svg>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Nâng cấp lên Premium
            </h1>
            
            <p className="text-xl text-gray-600 mb-8">
              Trải nghiệm anime với chất lượng cao nhất
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="text-4xl mb-3">🎬</div>
              <h3 className="font-bold text-gray-900 mb-2">Full HD 1080p</h3>
              <p className="text-sm text-gray-600">
                Xem anime với chất lượng cao nhất
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-bold text-gray-900 mb-2">Không quảng cáo</h3>
              <p className="text-sm text-gray-600">
                Trải nghiệm xem liền mạch
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
              <div className="text-4xl mb-3">🌟</div>
              <h3 className="font-bold text-gray-900 mb-2">Ưu tiên truy cập</h3>
              <p className="text-sm text-gray-600">
                Xem phim mới sớm nhất
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-8 text-white mb-8">
            <h2 className="text-3xl font-bold mb-4">Chỉ 99.000đ/tháng</h2>
            <p className="text-lg opacity-90 mb-6">
              Hoặc 990.000đ/năm (Tiết kiệm 20%)
            </p>
            
            <button 
              className="bg-white text-orange-500 px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105"
              onClick={() => alert('Tính năng đang phát triển')}
            >
              Đăng ký ngay
            </button>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Quay lại
          </button>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm">
              💡 <strong>Lưu ý:</strong> Trang này đang được phát triển. 
              Chức năng thanh toán sẽ được bổ sung trong tương lai.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPage;
