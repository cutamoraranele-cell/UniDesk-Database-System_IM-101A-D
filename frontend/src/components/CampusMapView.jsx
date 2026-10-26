import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Navigation, 
  Compass, 
  Phone, 
  Mail, 
  CheckCircle,
  ExternalLink,
  Info,
  Sparkles,
  RotateCcw,
  Maximize2
} from 'lucide-react';

// Tile provider presets (100% Free - OpenStreetMap & CartoDB)
const TILE_PROVIDERS = {
  street: {
    id: 'street',
    label: 'Street View (OSM)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19
  },
  dark: {
    id: 'dark',
    label: 'Dark Mode (Carto)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    maxZoom: 20
  },
  voyager: {
    id: 'voyager',
    label: 'Voyager (Vibrant)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    maxZoom: 20
  }
};

// Real Campus Coordinates & Buildings
const CAMPUS_CENTER = [9.650000, 123.868400];

const DEFAULT_BUILDINGS = [
  {
    building_id: 1,
    building_code: 'CAS-BLDG',
    building_name: 'CAS Building',
    name: 'CAS Building',
    total_floors: 5,
    latitude: 9.650091,
    longitude: 123.868115,
    total_facilities: 2
  },
  {
    building_id: 2,
    building_code: 'BATES-BLDG',
    building_name: 'Bates Building',
    name: 'Bates Building',
    total_floors: 3,
    latitude: 9.649228,
    longitude: 123.868618,
    total_facilities: 3
  },
  {
    building_id: 3,
    building_code: 'CLINIC-BLDG',
    building_name: 'Clinic House',
    name: 'Clinic House',
    total_floors: 1,
    latitude: 9.649672,
    longitude: 123.868158,
    total_facilities: 1
  },
  {
    building_id: 4,
    building_code: 'ACT-BLDG',
    building_name: 'Activity Center Building',
    name: 'Activity Center Building',
    total_floors: 3,
    latitude: 9.650162,
    longitude: 123.868730,
    total_facilities: 1
  },
  {
    building_id: 5,
    building_code: 'FRIENA-BLDG',
    building_name: 'Friena Building',
    name: 'Friena Building',
    total_floors: 5,
    latitude: 9.650655,
    longitude: 123.868176,
    total_facilities: 1
  }
];

const DEFAULT_FACILITIES = [
  {
    facility_id: 1,
    building_id: 2,
    building_code: 'BATES-BLDG',
    category_id: 1,
    category_code: 'ADMIN',
    category_name: 'Administrative & Records',
    room_number: 'Ground Floor',
    floor_number: 1,
    facility_name: "Registrar's Office",
    description: "Academic records, transcripts, diplomas, and enrollment certificates."
  },
  {
    facility_id: 2,
    building_id: 2,
    building_code: 'BATES-BLDG',
    category_id: 2,
    category_code: 'FINANCE',
    category_name: 'Financial Services & Treasury',
    room_number: 'Ground Floor',
    floor_number: 1,
    facility_name: "Cashier Office",
    description: "Tuition assessments, fee settlements, refunds, and official receipts."
  },
  {
    facility_id: 3,
    building_id: 4,
    building_code: 'ACT-BLDG',
    category_id: 3,
    category_code: 'STUDENT_WELFARE',
    category_name: 'Student Affairs & Welfare',
    room_number: '2nd Floor',
    floor_number: 2,
    facility_name: "Student Affairs Office room",
    description: "Student identification cards, student conduct, and organization accreditation."
  },
  {
    facility_id: 4,
    building_id: 3,
    building_code: 'CLINIC-BLDG',
    category_id: 4,
    category_code: 'HEALTH',
    category_name: 'Health & Medical Services',
    room_number: 'Ground Floor',
    floor_number: 1,
    facility_name: "Clinic house",
    description: "Campus physician, health consultations, triage station, pharmacy, and medical care."
  },
  {
    facility_id: 5,
    building_id: 1,
    building_code: 'CAS-BLDG',
    category_id: 5,
    category_code: 'COUNSELING',
    category_name: 'Guidance & Psychological Services',
    room_number: '5th Floor',
    floor_number: 5,
    facility_name: "Guidance and Counseling room",
    description: "Confidential psychological counseling, peer support, and mental wellness consultation."
  },
  {
    facility_id: 6,
    building_id: 1,
    building_code: 'CAS-BLDG',
    category_id: 6,
    category_code: 'LIBRARY',
    category_name: 'Library & Learning Commons',
    room_number: '3rd Floor',
    floor_number: 3,
    facility_name: "University Library room",
    description: "Multi-floor learning commons, reference collections, thesis archives, and study areas."
  },
  {
    facility_id: 7,
    building_id: 2,
    building_code: 'BATES-BLDG',
    category_id: 7,
    category_code: 'IT_SUPPORT',
    category_name: 'IT & Digital Infrastructure',
    room_number: 'Ground Floor',
    floor_number: 1,
    facility_name: "Computer Laboratory",
    description: "High-speed student terminal access, programming labs, and software workstations."
  },
  {
    facility_id: 8,
    building_id: 5,
    building_code: 'FRIENA-BLDG',
    category_id: 3,
    category_code: 'STUDENT_WELFARE',
    category_name: 'Convocations & Events',
    room_number: '5th Floor',
    floor_number: 5,
    facility_name: "Auditorium room",
    description: "5th floor auditorium theater hall for symposiums, convocations, and cultural performances."
  }
];

export default function CampusMapView({ 
  targetBuildingCode, 
  selectedBuilding: propSelectedBuilding, 
  onSelectBuilding: propOnSelectBuilding,
  onOpenOfficeDetail,
  onBookAppointment
}) {
  const [buildings, setBuildings] = useState(DEFAULT_BUILDINGS);
  const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);
  const [categories, setCategories] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(DEFAULT_BUILDINGS[0]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [mapStyle, setMapStyle] = useState('street');
  const [loading, setLoading] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bRes, fRes, cRes] = await Promise.all([
        fetch('https://unidesk-api.onrender.com/api/facilities/buildings'),
        fetch('https://unidesk-api.onrender.com/api/facilities'),
        fetch('https://unidesk-api.onrender.com/api/facilities/categories')
      ]);

      const [bData, fData, cData] = await Promise.all([
        bRes.json(),
        fRes.json(),
        cRes.json()
      ]);

      if (bData.success && bData.data.length > 0) {
        setBuildings(bData.data);
        if (!selectedBuilding) {
          setSelectedBuilding(bData.data[0]);
        }
      }
      if (fData.success && fData.data.length > 0) setFacilities(fData.data);
      if (cData.success && cData.data.length > 0) setCategories(cData.data);
    } catch (err) {
      console.warn('API fetch failed, utilizing real campus defaults:', err);
    }
  };

  // Sync external building selection from prop
  useEffect(() => {
    const codeOrName = targetBuildingCode || propSelectedBuilding;
    if (codeOrName && buildings.length > 0) {
      const match = buildings.find(b => 
        b.building_code === codeOrName || 
        b.building_name === codeOrName || 
        b.name === codeOrName
      );
      if (match) {
        handleSelectBuilding(match, true);
      }
    }
  }, [targetBuildingCode, propSelectedBuilding, buildings]);

  // --------------------------------------------------------------------------
  // LEAFLET MAP INITIALIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: CAMPUS_CENTER,
      zoom: 18,
      minZoom: 15,
      maxZoom: 19,
      zoomControl: true,
      attributionControl: false
    });

    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

    // Initial tile layer
    const activeTile = TILE_PROVIDERS[mapStyle];
    tileLayerRef.current = L.tileLayer(activeTile.url, {
      attribution: activeTile.attribution,
      maxZoom: activeTile.maxZoom,
      subdomains: 'abcd'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Tile Layer on Style Switch
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    const activeTile = TILE_PROVIDERS[mapStyle];
    mapRef.current.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(activeTile.url, {
      attribution: activeTile.attribution,
      maxZoom: activeTile.maxZoom,
      subdomains: 'abcd'
    }).addTo(mapRef.current);
  }, [mapStyle]);

  // Create Custom HTML Pin Icon
  const createBuildingIcon = (b, isSelected) => {
    const shortCode = b.building_code ? b.building_code.replace('-BLDG', '') : 'BLD';
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div class="campus-pin-wrapper ${isSelected ? 'active' : ''}">
          ${isSelected ? '<div class="campus-pin-pulse"></div>' : ''}
          <div class="campus-pin-bubble">
            <span>🏛️</span>
            <span>${shortCode}</span>
          </div>
          <div class="campus-pin-label">${b.building_name || b.name}</div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22]
    });
  };

  // Render & Refresh Building Markers
  useEffect(() => {
    if (!mapRef.current || buildings.length === 0) return;

    // Remove old markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    buildings.forEach((b) => {
      const lat = parseFloat(b.latitude);
      const lng = parseFloat(b.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      const isSelected = (selectedBuilding?.building_code === b.building_code) || 
                         (selectedBuilding?.name === b.name);
      const icon = createBuildingIcon(b, isSelected);

      const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current);

      const buildingFacs = facilities.filter(f => 
        f.building_id === b.building_id || f.building_code === b.building_code
      );

      const popupHtml = `
        <div style="font-family: inherit; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
            <span style="font-size: 10px; font-weight: 700; color: #38bdf8; background: rgba(56, 189, 248, 0.12); padding: 2px 7px; border-radius: 5px; font-family: monospace;">
              ${b.building_code || 'CAMPUS'}
            </span>
            <span style="font-size: 11px; color: #94a3b8; font-weight: 600;">${b.total_floors} Floors</span>
          </div>
          <div style="font-weight: 800; font-size: 14px; color: #ffffff; margin-bottom: 5px;">
            ${b.building_name || b.name}
          </div>
          <div style="font-size: 11.5px; color: #cbd5e1; margin-bottom: 8px;">
            🏛️ ${buildingFacs.length || b.total_facilities || 0} Registered Facilities
          </div>
          <div style="font-size: 10px; color: #38bdf8; font-family: monospace; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 6px;">
            GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        offset: [0, -10]
      });

      marker.on('click', () => {
        handleSelectBuilding(b, false);
      });

      markersRef.current[b.building_code || b.name] = marker;
    });
  }, [buildings, facilities, selectedBuilding?.building_code, selectedBuilding?.name]);

  // Handle building selection (with map flyTo)
  const handleSelectBuilding = (b, fly = true) => {
    setSelectedBuilding(b);
    if (propOnSelectBuilding) {
      propOnSelectBuilding(b.building_name || b.name);
    }
    if (mapRef.current && fly) {
      const lat = parseFloat(b.latitude);
      const lng = parseFloat(b.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        mapRef.current.flyTo([lat, lng], 18.5, {
          duration: 0.9,
          easeLinearity: 0.25
        });
        const marker = markersRef.current[b.building_code || b.name];
        if (marker) {
          setTimeout(() => marker.openPopup(), 400);
        }
      }
    }
  };

  // Recenter map view to campus coordinates
  const handleRecenter = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo(CAMPUS_CENTER, 18, { duration: 0.8 });
  };

  const filteredFacilities = facilities.filter(f => {
    const matchesBuilding = selectedBuilding ? (
      f.building_id === selectedBuilding.building_id ||
      f.building_code === selectedBuilding.building_code ||
      f.b === (selectedBuilding.building_name || selectedBuilding.name)
    ) : true;
    const matchesCategory = selectedCategory ? (
      f.category_code === selectedCategory || f.t === selectedCategory
    ) : true;
    return matchesBuilding && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Category Filter Chips */}
      <div className="glass-card" style={{ padding: '1.15rem 1.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Facility Category Filter:
          </span>
          <button
            className={`search-chip ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All Categories
          </button>
          {categories.length > 0 ? (
            categories.map(cat => (
              <button
                key={cat.category_id}
                className={`search-chip ${selectedCategory === cat.category_code ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.category_code)}
              >
                {cat.name}
              </button>
            ))
          ) : (
            ['ADMIN', 'FINANCE', 'HEALTH', 'COUNSELING', 'LIBRARY', 'IT_SUPPORT'].map(code => (
              <button
                key={code}
                className={`search-chip ${selectedCategory === code ? 'active' : ''}`}
                onClick={() => setSelectedCategory(code)}
              >
                {code.replace('_', ' ')}
              </button>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '1.5rem' }}>
        {/* Real Live Leaflet Map Canvas */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
              <Navigation size={19} color="#38bdf8" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Real Live Campus Map</h3>
              <span style={{ 
                fontSize: '0.7rem', 
                background: 'rgba(16, 185, 129, 0.15)', 
                color: '#34d399', 
                padding: '0.2rem 0.55rem', 
                borderRadius: '6px', 
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                LIVE GPS
              </span>
            </div>

            {/* Map Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {/* Tile Style Selector */}
              <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', padding: '2px', border: '1px solid var(--border-subtle)' }}>
                {Object.values(TILE_PROVIDERS).map(tile => (
                  <button
                    key={tile.id}
                    onClick={() => setMapStyle(tile.id)}
                    style={{
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      background: mapStyle === tile.id ? 'var(--primary, #38bdf8)' : 'transparent',
                      color: mapStyle === tile.id ? '#0f172a' : 'var(--text-dim)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {tile.label.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Recenter Button */}
              <button
                onClick={handleRecenter}
                title="Recenter Campus View"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.35rem 0.7rem',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={13} />
                <span>Recenter</span>
              </button>
            </div>
          </div>

          {/* Real Leaflet Map Container */}
          <div ref={mapContainerRef} className="campus-live-map-container" style={{ height: '480px' }} />

          {/* Building Quick Selector Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Buildings:
            </span>
            {buildings.map(b => {
              const isSelected = selectedBuilding?.building_code === b.building_code || 
                                 selectedBuilding?.name === b.name;
              return (
                <button
                  key={b.building_id || b.building_code}
                  onClick={() => handleSelectBuilding(b, true)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid var(--border-subtle)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {b.building_name || b.name}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Sparkles size={14} color="#38bdf8" />
              <span>Live real-world OpenStreetMap tiles. Click any building marker to inspect rooms.</span>
            </div>
            {selectedBuilding && (
              <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontSize: '0.72rem' }}>
                GPS: {parseFloat(selectedBuilding.latitude).toFixed(6)}, {parseFloat(selectedBuilding.longitude).toFixed(6)}
              </span>
            )}
          </div>
        </div>

        {/* Building & Facilities Inspector */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.65rem' }}>
          {selectedBuilding ? (
            <>
              <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="office-code-badge">{selectedBuilding.building_code || 'CAMPUS'}</span>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.45rem' }}>
                      {selectedBuilding.building_name || selectedBuilding.name}
                    </h3>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--primary-light)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {selectedBuilding.total_floors} Floors Total
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.45rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    📍 Coordinates: {parseFloat(selectedBuilding.latitude).toFixed(6)}, {parseFloat(selectedBuilding.longitude).toFixed(6)}
                  </p>
                  <button
                    onClick={() => handleSelectBuilding(selectedBuilding, true)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Focus Map
                  </button>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Facilities & Rooms ({filteredFacilities.length})
                  </h4>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '390px', overflowY: 'auto', paddingRight: '0.35rem' }}>
                  {filteredFacilities.map(fac => (
                    <div 
                      key={fac.facility_id}
                      style={{
                        padding: '1rem',
                        borderRadius: '14px',
                        background: 'rgba(10, 14, 24, 0.7)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.4rem',
                        transition: 'border-color 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary-light)', fontSize: '0.92rem', fontFamily: 'var(--font-mono)' }}>
                          {fac.room_number} {fac.floor_number ? `(Floor ${fac.floor_number})` : ''}
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--text-dim)',
                          fontWeight: 600
                        }}>
                          {fac.category_name || fac.t || 'Facility'}
                        </span>
                      </div>
                      <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.96rem' }}>
                        {fac.facility_name || fac.n}
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {fac.description || fac.d}
                      </p>
                      <div style={{ marginTop: '0.45rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {onBookAppointment && (
                          <button
                            className="pr sm"
                            style={{
                              background: '#f6c915',
                              color: '#0f172a',
                              fontWeight: 700,
                              fontSize: '0.74rem',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '8px',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem'
                            }}
                            onClick={() => onBookAppointment(fac)}
                          >
                            📅 Book In-Person Appointment (No Fee)
                          </button>
                        )}
                        {onOpenOfficeDetail && (
                          <button
                            className="sm"
                            style={{ 
                              background: 'rgba(56, 189, 248, 0.15)', 
                              color: '#38bdf8', 
                              border: '1px solid rgba(56, 189, 248, 0.3)', 
                              borderRadius: '8px', 
                              padding: '0.25rem 0.6rem', 
                              fontSize: '0.72rem', 
                              cursor: 'pointer' 
                            }}
                            onClick={() => onOpenOfficeDetail(fac)}
                          >
                            View Details &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredFacilities.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      No facilities found matching selected filter in this building.
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-dim)' }}>
              Select a building from the map to inspect its floor directory.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
