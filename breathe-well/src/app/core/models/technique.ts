export interface Technique {
  id: string;
  name: string;
  aliases: string[];
  level: string | null;
  how_to: string | null;
  after_feel: string | null;
  short_desc: string | null;
  description: string | null;
  categories: string[];
  more_information: { title: string }[];
}
