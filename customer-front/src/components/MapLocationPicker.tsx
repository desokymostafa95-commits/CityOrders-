import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

type LocationValue = {
    lat: number;
    lng: number;
};

type MapLocationPickerProps = {
    latitude?: number | null;
    longitude?: number | null;
    onChange: (value: LocationValue) => void;
    height?: number;
};

const DEFAULT_LOCATION = {
    lat: 30.0444,
    lng: 31.2357,
};

const isValidCoordinate = (value?: number | null): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value !== 0;

const createMapHtml = (lat: number, lng: number) => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #f4f5f7;
    }

    .leaflet-control-attribution {
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      var selectedLat = ${lat};
      var selectedLng = ${lng};
      var map = L.map('map', { zoomControl: true }).setView([selectedLat, selectedLng], 16);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      var marker = L.marker([selectedLat, selectedLng], { draggable: true }).addTo(map);

      function sendLocation(latlng) {
        var message = JSON.stringify({
          lat: Number(latlng.lat.toFixed(6)),
          lng: Number(latlng.lng.toFixed(6))
        });

        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(message);
        } else {
          window.parent.postMessage(message, '*');
        }
      }

      window.setSelectedLocation = function (lat, lng) {
        var nextLocation = L.latLng(lat, lng);
        marker.setLatLng(nextLocation);
        map.setView(nextLocation, map.getZoom() || 16);
      };

      map.on('click', function (event) {
        marker.setLatLng(event.latlng);
        sendLocation(event.latlng);
      });

      marker.on('dragend', function () {
        sendLocation(marker.getLatLng());
      });
    })();
  </script>
</body>
</html>`;

export function MapLocationPicker({
    latitude,
    longitude,
    onChange,
    height = 280,
}: MapLocationPickerProps) {
    const webViewRef = useRef<React.ComponentRef<typeof WebView>>(null);
    const selectedLat = isValidCoordinate(latitude) ? latitude : DEFAULT_LOCATION.lat;
    const selectedLng = isValidCoordinate(longitude) ? longitude : DEFAULT_LOCATION.lng;
    const initialLocation = useRef({ lat: selectedLat, lng: selectedLng });

    const html = useMemo(
        () => createMapHtml(initialLocation.current.lat, initialLocation.current.lng),
        []
    );

    const handleLocationMessage = useCallback((message: string) => {
        try {
            const data = JSON.parse(message) as LocationValue;
            if (Number.isFinite(data.lat) && Number.isFinite(data.lng)) {
                onChange({ lat: data.lat, lng: data.lng });
            }
        } catch {
            // Ignore malformed messages from the embedded map.
        }
    }, [onChange]);

    const syncSelectedLocation = useCallback(() => {
        webViewRef.current?.injectJavaScript(
            `window.setSelectedLocation && window.setSelectedLocation(${selectedLat}, ${selectedLng}); true;`
        );
    }, [selectedLat, selectedLng]);

    useEffect(() => {
        syncSelectedLocation();
    }, [syncSelectedLocation]);

    useEffect(() => {
        if (Platform.OS !== 'web' || typeof window === 'undefined') return;

        const handleMessage = (event: MessageEvent) => {
            if (typeof event.data === 'string') {
                handleLocationMessage(event.data);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [handleLocationMessage]);

    if (Platform.OS === 'web') {
        return (
            <View style={[styles.container, { height }]}>
                {React.createElement('iframe', {
                    key: `${selectedLat}:${selectedLng}`,
                    title: 'Location map',
                    srcDoc: createMapHtml(selectedLat, selectedLng),
                    style: styles.iframe,
                })}
            </View>
        );
    }

    return (
        <View style={[styles.container, { height }]}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html }}
                javaScriptEnabled
                domStorageEnabled
                nestedScrollEnabled
                applicationNameForUserAgent="CityOrdersLocationPicker"
                onLoadEnd={syncSelectedLocation}
                onMessage={(event) => {
                    handleLocationMessage(event.nativeEvent.data);
                }}
                style={styles.webview}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(0,0,0,0.18)',
        backgroundColor: '#f4f5f7',
        marginBottom: 16,
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    iframe: {
        borderWidth: 0,
        width: '100%',
        height: '100%',
    },
});
