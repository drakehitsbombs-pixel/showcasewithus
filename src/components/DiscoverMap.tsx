import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Creator {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  styles: string[];
  city: string | null;
  min_project_budget_usd: number;
  geo_lat: number | null;
  geo_lng: number | null;
  slug: string | null;
}

interface DiscoverMapProps {
  creators: Creator[];
  userLocation?: { lat: number; lng: number } | null;
  onMarkerClick?: (creator: Creator) => void;
}

const DiscoverMap = ({ creators, userLocation, onMarkerClick }: DiscoverMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Fetch Mapbox token from backend
    const fetchToken = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/config-mapbox-token`);
        if (response.ok) {
          const data = await response.json();
          setMapboxToken(data.token);
        } else {
          setError('Mapbox token not configured');
        }
      } catch (err) {
        setError('Failed to load map configuration');
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Initialize map
    mapboxgl.accessToken = mapboxToken;
    
    const centerLat = userLocation?.lat || 37.7749;
    const centerLng = userLocation?.lng || -122.4194;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [centerLng, centerLat],
      zoom: userLocation ? 9 : 4,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: false,
      }),
      'top-right'
    );

    // Add user location marker if available
    if (userLocation) {
      const userMarkerEl = document.createElement('div');
      userMarkerEl.className = 'user-location-marker';
      userMarkerEl.style.cssText = `
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: hsl(var(--primary));
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      `;
      
      new mapboxgl.Marker(userMarkerEl)
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, userLocation]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add creator markers
    creators.forEach(creator => {
      if (!creator.geo_lat || !creator.geo_lng || !map.current) return;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'creator-map-marker';
      el.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-image: url(${creator.avatar_url || '/placeholder.svg'});
        background-size: cover;
        background-position: center;
        border: 3px solid hsl(var(--primary));
        cursor: pointer;
        transition: transform 0.2s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      `;
      
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: hsl(var(--foreground));">
              ${creator.display_name}
            </h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: hsl(var(--muted-foreground));">
              ${creator.city || 'Location not specified'}
            </p>
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
              ${creator.styles.slice(0, 3).map(style => 
                `<span style="display: inline-block; padding: 2px 8px; background: hsl(var(--muted)); border-radius: 12px; font-size: 11px; color: hsl(var(--foreground));">${style}</span>`
              ).join('')}
            </div>
            <p style="margin: 0; font-size: 13px; font-weight: 500; color: hsl(var(--foreground));">
              From $${creator.min_project_budget_usd.toLocaleString()}
            </p>
          </div>
        `);

      // Create and add marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([creator.geo_lng, creator.geo_lat])
        .setPopup(popup)
        .addTo(map.current);

      // Handle click
      el.addEventListener('click', () => {
        if (onMarkerClick) {
          onMarkerClick(creator);
        }
      });

      markers.current.push(marker);
    });
  }, [creators, onMarkerClick]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/20 rounded-lg p-8">
        <div className="text-center max-w-md">
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            To enable map view, add your Mapbox public token in Cloud → Secrets → Add MAPBOX_PUBLIC_TOKEN
          </p>
        </div>
      </div>
    );
  }

  if (!mapboxToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
    </div>
  );
};

export default DiscoverMap;
