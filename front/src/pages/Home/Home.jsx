import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGames } from '../../contexts/GameContext';
import { adService } from '../../services/adService';
import { Gamepad, Star, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../../components/Common/LoadingSpinner';

const Home = () => {
  const { featuredGames, loading: gamesLoading } = useGames();
  const [boostedAds, setBoostedAds] = useState([]);
  const [adsLoading, setAdsLoading] = useState(false);

  useEffect(() => {
    const fetchBoostedAds = async () => {
      setAdsLoading(true);
      const result = await adService.getBoostedAds({ limit: 6 });
      if (result.success) {
        setBoostedAds(result.data.boosted_ads);
      }
      setAdsLoading(false);
    };

    fetchBoostedAds();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Bem-vindo ao GameUnite
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            A plataforma que conecta gamers para compra, venda e troca de jogos. 
            Encontre os melhores preços e faça parte da maior comunidade gamer do Brasil.
          </p>
          <div className="space-x-4">
            <Link
              to="/games"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
            >
              Explorar Jogos
            </Link>
            <Link
              to="/register"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-block"
            >
              Começar Agora
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Games */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              <Star className="inline w-8 h-8 mr-2 text-yellow-500" />
              Jogos em Destaque
            </h2>
            <p className="text-gray-600">Os jogos mais populares da nossa plataforma</p>
          </div>

          {gamesLoading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredGames.map((game) => (
                <Link
                  key={game._id}
                  to={`/games/${game._id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="h-48 bg-gray-200 flex items-center justify-center">
                    {game.image_url ? (
                      <img
                        src={game.image_url}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                        <Gamepad className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{game.name}</h3>
                    <p className="text-gray-600 text-sm">{game.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Boosted Ads */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              <TrendingUp className="inline w-8 h-8 mr-2 text-green-500" />
              Anúncios em Destaque
            </h2>
            <p className="text-gray-600">As melhores ofertas da semana</p>
          </div>

          {adsLoading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boostedAds.map((ad) => (
                <Link
                  key={ad._id}
                  to={`/ads/${ad._id}`}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border-2 border-yellow-400"
                >
                  <div className="bg-yellow-400 text-yellow-800 px-3 py-1 text-sm font-semibold">
                    ⭐ DESTAQUE
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{ad.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{ad.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-green-600">
                        R$ {ad.price}
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                        {ad.ad_type}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Pronto para começar?
          </h2>
          <p className="text-xl mb-8">
            Junte-se a milhares de gamers e encontre os melhores jogos!
          </p>
          <Link
            to="/register"
            className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Criar Conta Grátis
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;