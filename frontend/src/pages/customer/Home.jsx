import React, { useState, useEffect } from "react";
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from "react-router-dom";
import {
  restaurantService,
  categoryService,
  appSettingsService,
} from "../../services/api";
import Loading from "../../components/common/Loading";

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [specialRestaurants, setSpecialRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [appSettings, setAppSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { translate } = useLanguage();
  
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh data when user comes back after being away for a while
  useEffect(() => {
    let lastFetchTime = Date.now();
    const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const timeSinceLastFetch = Date.now() - lastFetchTime;
        // Only refresh if user has been away for more than 5 minutes
        if (timeSinceLastFetch > REFRESH_INTERVAL) {
          fetchData();
          lastFetchTime = Date.now();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Try to fetch from API first
      try {
        const [restaurantsRes, specialRes, categoriesRes, settingsRes] =
          await Promise.all([
            restaurantService.getAll({ page_size: 8 }),
            restaurantService.getSpecial({ page_size: 4 }),
            categoryService.getAll({ page_size: 6 }),
            appSettingsService.getPublic({ _t: new Date().getTime() }), // Only app settings need cache busting
          ]);

        setRestaurants(restaurantsRes.data?.results || []);
        setSpecialRestaurants(specialRes.data?.results || []);
        setCategories(categoriesRes.data?.results || []);
        setAppSettings(settingsRes.data || null);

        // Only log in development mode
        if (process.env.NODE_ENV === "development") {
          console.log("✅ Data fetched at", new Date().toLocaleString(), {
            restaurants: restaurantsRes.data?.results?.length,
            specialRestaurants: specialRes.data?.results?.length,
            categories: categoriesRes.data?.results?.length,
            appSettings: settingsRes.data?.app_name,
          });
        }
      } catch (apiError) {
        console.error("API error:", apiError);
        throw apiError; // Re-throw to be caught by outer catch
      }
    } catch (err) {
      setError('Unable to load data');
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="large" text="Loading data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <p className="text-secondary-600">{error}</p>
          <button onClick={fetchData} className="btn-primary mt-4">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero Section - Reduced Size */}
      <section className="relative overflow-hidden">
        {/* Banner Background */}
        {appSettings?.banner_url && (
          <div className="absolute inset-0">
            <img
              src={appSettings.banner_url}
              alt="Banner"
              className="w-full h-full object-cover"
            />
            {/* Light overlay for better text readability */}
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
        )}

        {/* Fallback background if no banner */}
        {!appSettings?.banner_url && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-800"></div>
        )}

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white drop-shadow-lg">
              {appSettings?.hero_title || 'Welcome to ' + (appSettings?.app_name || 'FoodDelivery')}
            </h1>
            <p className="text-lg md:text-xl mb-6 text-white/90 drop-shadow-md">
              {appSettings?.hero_subtitle || 'Order food from your favorite restaurants easily with just a finger'}
            </p>
            <div className="flex justify-center">
              <Link
                to="/products"
                className="btn-primary bg-white text-primary-600 hover:bg-primary-50 px-6 py-2 shadow-lg"
              >
                {translate('common.order_now')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-secondary-900">
              {translate('common.popular_categories')}
            </h2>
            <Link
              to="/categories"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {translate('common.view_all')} →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.category_id}
                to={`/categories/${category.category_id}`}
                className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 text-center"
              >
                <div className="mb-4">
                  <img
                    src={
                      category.image_display_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        category.category_name
                      )}&background=ef4444&color=fff&size=80`
                    }
                    alt={category.category_name}
                    className="w-16 h-16 mx-auto rounded-full object-cover"
                  />
                </div>
                <h3 className="font-medium text-secondary-900 group-hover:text-primary-600">
                  {category.category_name}
                </h3>
              </Link>
            ))}
          </div>
        </section>

        {/* Special Restaurants Section */}
        {specialRestaurants.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-secondary-900">
                {translate('common.recommended_restaurants')}
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  ⭐ {translate('common.special')}
                </span>
              </h2>
              <Link
                to="/restaurants?type=special"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {translate('common.view_all')} →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {specialRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.restaurant_id}
                  restaurant={restaurant}
                  isSpecial={true}
                  translate={translate}
                />
              ))}
            </div>
          </section>
        )}

        {/* Popular Restaurants Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-secondary-900">
              {translate('common.popular_restaurants')}
            </h2>
            <Link
              to="/restaurants"
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {translate('common.view_all')} →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {restaurants.map((restaurant) => (
              <RestaurantCard
                key={restaurant.restaurant_id}
                restaurant={restaurant}
                translate={translate}
              />
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white rounded-lg shadow-sm">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-3xl font-bold text-secondary-900 mb-12">
              {translate('common.why_choose_us')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <span className="text-2xl">
                    {appSettings?.feature_1_icon || "🚚"}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  {appSettings?.feature_1_title || "Fast delivery"}
                </h3>
                <p className="text-secondary-600">
                  {appSettings?.feature_1_description ||
                    "Deliver food to your hand within 30-45 minutes"}
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <span className="text-2xl">
                    {appSettings?.feature_2_icon || "🍽️"}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  {appSettings?.feature_2_title || "Good quality"}
                </h3>
                <p className="text-secondary-600">
                  {appSettings?.feature_2_description ||
                    "Restaurants with good quality through selection"}
                </p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
                  <span className="text-2xl">
                    {appSettings?.feature_3_icon || "💳"}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-secondary-900 mb-2">
                  {appSettings?.feature_3_title || "Easy payment"}
                </h3>
                <p className="text-secondary-600">
                  {appSettings?.feature_3_description ||
                    "Support multiple payment methods"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

// Restaurant Card Component
const RestaurantCard = ({ restaurant, isSpecial = false, translate }) => (
  <Link
    to={`/restaurants/${restaurant.restaurant_id}`}
    className="group bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
  >
    <div className="relative">
      <img
        src={
          restaurant.image ||
          `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop`
        }
        alt={restaurant.restaurant_name}
        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
      />
      {isSpecial && (
        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
          ⭐ {translate('common.special')}
        </div>
      )}
      {restaurant.status === "closed" && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <span className="text-white text-lg font-medium">{translate('common.closed')}</span>
        </div>
      )}
    </div>

    <div className="p-4">
      <h3 className="font-semibold text-lg text-secondary-900 mb-1 group-hover:text-primary-600">
        {restaurant.restaurant_name}
      </h3>
      <p className="text-secondary-600 text-sm mb-2 line-clamp-2">
        {restaurant.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-yellow-400 mr-1">⭐</span>
          <span className="text-sm font-medium text-secondary-700">
            {restaurant.average_rating &&
            !isNaN(Number(restaurant.average_rating))
              ? Number(restaurant.average_rating).toFixed(1)
              : 'New'}
          </span>
          <span className="text-secondary-500 text-sm ml-1">
            ({restaurant.total_reviews || 0})
          </span>
        </div>

        <div className="text-right">
          <p className="text-sm text-secondary-500">{translate('common.delivery')}</p>
          <p className="text-sm font-medium text-secondary-700">1-2$</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-sm text-secondary-500">
        <span>{translate('common.delivery_time')}</span>
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            restaurant.status === "open"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {restaurant.status === "open" ? translate('common.open') : translate('common.closed')}
        </span>
      </div>
    </div>
  </Link>
);

export default Home;
