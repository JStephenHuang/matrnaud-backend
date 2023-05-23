export type Photo = {
  id: string;
  title: string;
  description: string;
  mainPhoto: string;
  popularity: number;
  active: boolean;
  price: number;
  photoshoot: { id: string; url: string }[];
};

export type Series = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  frames: string[];
  active: boolean;
};

export type Frame = {
  id: string;
  seriesId: string;
  title: string;
  price: string;
  url: string;
};
