// src/types/kakao.d.ts
interface Window {
  kakao: any;
}

declare namespace kakao.maps {
  class LatLng {
    constructor(latitude: number, longitude: number);
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
  }

  class Marker {
    constructor(options: MarkerOptions);
  }

  interface MapOptions {
    center: LatLng;
    level: number;
  }

  interface MarkerOptions {
    position: LatLng;
    map: Map;
  }

  function load(callback: () => void): void;
}
