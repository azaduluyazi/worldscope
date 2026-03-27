/** Country metadata for SEO pages and geo-filtering */
export interface CountryMeta {
  code: string;       // ISO 3166-1 alpha-2
  name: string;
  nameTr: string;     // Turkish name
  lat: number;
  lng: number;
  zoom: number;       // Default map zoom for this country
  region: string;     // Broad region for grouping
}

export const COUNTRIES: CountryMeta[] = [
  // ══════════════════════════════════════════
  // ── Middle East (16) ──
  // ══════════════════════════════════════════
  { code: "TR", name: "Turkey", nameTr: "Türkiye", lat: 39.0, lng: 35.0, zoom: 5.5, region: "Middle East" },
  { code: "IL", name: "Israel", nameTr: "İsrail", lat: 31.5, lng: 34.8, zoom: 7, region: "Middle East" },
  { code: "IR", name: "Iran", nameTr: "İran", lat: 32.4, lng: 53.7, zoom: 5, region: "Middle East" },
  { code: "IQ", name: "Iraq", nameTr: "Irak", lat: 33.2, lng: 43.7, zoom: 5.5, region: "Middle East" },
  { code: "SY", name: "Syria", nameTr: "Suriye", lat: 35.0, lng: 38.0, zoom: 6, region: "Middle East" },
  { code: "SA", name: "Saudi Arabia", nameTr: "Suudi Arabistan", lat: 23.9, lng: 45.1, zoom: 5, region: "Middle East" },
  { code: "AE", name: "UAE", nameTr: "BAE", lat: 23.4, lng: 53.8, zoom: 6, region: "Middle East" },
  { code: "YE", name: "Yemen", nameTr: "Yemen", lat: 15.6, lng: 48.5, zoom: 5.5, region: "Middle East" },
  { code: "LB", name: "Lebanon", nameTr: "Lübnan", lat: 33.9, lng: 35.9, zoom: 8, region: "Middle East" },
  { code: "JO", name: "Jordan", nameTr: "Ürdün", lat: 30.6, lng: 36.2, zoom: 7, region: "Middle East" },
  { code: "KW", name: "Kuwait", nameTr: "Kuveyt", lat: 29.3, lng: 47.5, zoom: 8, region: "Middle East" },
  { code: "OM", name: "Oman", nameTr: "Umman", lat: 21.5, lng: 55.9, zoom: 6, region: "Middle East" },
  { code: "QA", name: "Qatar", nameTr: "Katar", lat: 25.4, lng: 51.2, zoom: 8, region: "Middle East" },
  { code: "BH", name: "Bahrain", nameTr: "Bahreyn", lat: 26.0, lng: 50.6, zoom: 9, region: "Middle East" },
  { code: "PS", name: "Palestine", nameTr: "Filistin", lat: 31.9, lng: 35.2, zoom: 8, region: "Middle East" },
  { code: "CY", name: "Cyprus", nameTr: "Kıbrıs", lat: 35.1, lng: 33.4, zoom: 8, region: "Middle East" },

  // ══════════════════════════════════════════
  // ── Europe (44) ──
  // ══════════════════════════════════════════
  { code: "UA", name: "Ukraine", nameTr: "Ukrayna", lat: 48.4, lng: 31.2, zoom: 5, region: "Europe" },
  { code: "RU", name: "Russia", nameTr: "Rusya", lat: 61.5, lng: 105.3, zoom: 3, region: "Europe" },
  { code: "DE", name: "Germany", nameTr: "Almanya", lat: 51.2, lng: 10.5, zoom: 5.5, region: "Europe" },
  { code: "FR", name: "France", nameTr: "Fransa", lat: 46.6, lng: 1.9, zoom: 5.5, region: "Europe" },
  { code: "GB", name: "United Kingdom", nameTr: "Birleşik Krallık", lat: 55.4, lng: -3.4, zoom: 5, region: "Europe" },
  { code: "PL", name: "Poland", nameTr: "Polonya", lat: 51.9, lng: 19.1, zoom: 5.5, region: "Europe" },
  { code: "IT", name: "Italy", nameTr: "İtalya", lat: 41.9, lng: 12.6, zoom: 5.5, region: "Europe" },
  { code: "ES", name: "Spain", nameTr: "İspanya", lat: 40.5, lng: -3.7, zoom: 5.5, region: "Europe" },
  { code: "PT", name: "Portugal", nameTr: "Portekiz", lat: 39.4, lng: -8.2, zoom: 6, region: "Europe" },
  { code: "NL", name: "Netherlands", nameTr: "Hollanda", lat: 52.1, lng: 5.3, zoom: 7, region: "Europe" },
  { code: "BE", name: "Belgium", nameTr: "Belçika", lat: 50.5, lng: 4.5, zoom: 7, region: "Europe" },
  { code: "AT", name: "Austria", nameTr: "Avusturya", lat: 47.5, lng: 14.6, zoom: 6.5, region: "Europe" },
  { code: "CH", name: "Switzerland", nameTr: "İsviçre", lat: 46.8, lng: 8.2, zoom: 7, region: "Europe" },
  { code: "SE", name: "Sweden", nameTr: "İsveç", lat: 60.1, lng: 18.6, zoom: 4.5, region: "Europe" },
  { code: "NO", name: "Norway", nameTr: "Norveç", lat: 60.5, lng: 8.5, zoom: 4.5, region: "Europe" },
  { code: "DK", name: "Denmark", nameTr: "Danimarka", lat: 56.3, lng: 9.5, zoom: 6, region: "Europe" },
  { code: "FI", name: "Finland", nameTr: "Finlandiya", lat: 61.9, lng: 25.7, zoom: 5, region: "Europe" },
  { code: "IE", name: "Ireland", nameTr: "İrlanda", lat: 53.1, lng: -7.7, zoom: 6, region: "Europe" },
  { code: "GR", name: "Greece", nameTr: "Yunanistan", lat: 39.1, lng: 21.8, zoom: 6, region: "Europe" },
  { code: "CZ", name: "Czech Republic", nameTr: "Çekya", lat: 49.8, lng: 15.5, zoom: 6.5, region: "Europe" },
  { code: "SK", name: "Slovakia", nameTr: "Slovakya", lat: 48.7, lng: 19.7, zoom: 7, region: "Europe" },
  { code: "HU", name: "Hungary", nameTr: "Macaristan", lat: 47.2, lng: 19.5, zoom: 6.5, region: "Europe" },
  { code: "RO", name: "Romania", nameTr: "Romanya", lat: 45.9, lng: 24.9, zoom: 6, region: "Europe" },
  { code: "BG", name: "Bulgaria", nameTr: "Bulgaristan", lat: 42.7, lng: 25.5, zoom: 6.5, region: "Europe" },
  { code: "RS", name: "Serbia", nameTr: "Sırbistan", lat: 44.0, lng: 21.0, zoom: 6.5, region: "Europe" },
  { code: "HR", name: "Croatia", nameTr: "Hırvatistan", lat: 45.1, lng: 15.2, zoom: 6.5, region: "Europe" },
  { code: "BA", name: "Bosnia and Herzegovina", nameTr: "Bosna Hersek", lat: 43.9, lng: 17.7, zoom: 7, region: "Europe" },
  { code: "SI", name: "Slovenia", nameTr: "Slovenya", lat: 46.2, lng: 14.8, zoom: 8, region: "Europe" },
  { code: "ME", name: "Montenegro", nameTr: "Karadağ", lat: 42.7, lng: 19.4, zoom: 8, region: "Europe" },
  { code: "MK", name: "North Macedonia", nameTr: "Kuzey Makedonya", lat: 41.5, lng: 21.7, zoom: 8, region: "Europe" },
  { code: "AL", name: "Albania", nameTr: "Arnavutluk", lat: 41.2, lng: 20.2, zoom: 7, region: "Europe" },
  { code: "XK", name: "Kosovo", nameTr: "Kosova", lat: 42.6, lng: 20.9, zoom: 8, region: "Europe" },
  { code: "EE", name: "Estonia", nameTr: "Estonya", lat: 58.6, lng: 25.0, zoom: 7, region: "Europe" },
  { code: "LV", name: "Latvia", nameTr: "Letonya", lat: 56.9, lng: 24.1, zoom: 7, region: "Europe" },
  { code: "LT", name: "Lithuania", nameTr: "Litvanya", lat: 55.2, lng: 23.9, zoom: 7, region: "Europe" },
  { code: "BY", name: "Belarus", nameTr: "Belarus", lat: 53.7, lng: 27.9, zoom: 6, region: "Europe" },
  { code: "MD", name: "Moldova", nameTr: "Moldova", lat: 47.4, lng: 28.4, zoom: 7, region: "Europe" },
  { code: "GE", name: "Georgia", nameTr: "Gürcistan", lat: 42.3, lng: 43.4, zoom: 7, region: "Europe" },
  { code: "AM", name: "Armenia", nameTr: "Ermenistan", lat: 40.1, lng: 45.0, zoom: 7, region: "Europe" },
  { code: "AZ", name: "Azerbaijan", nameTr: "Azerbaycan", lat: 40.1, lng: 47.6, zoom: 7, region: "Europe" },
  { code: "IS", name: "Iceland", nameTr: "İzlanda", lat: 64.9, lng: -19.0, zoom: 5.5, region: "Europe" },
  { code: "LU", name: "Luxembourg", nameTr: "Lüksemburg", lat: 49.8, lng: 6.1, zoom: 9, region: "Europe" },
  { code: "MT", name: "Malta", nameTr: "Malta", lat: 35.9, lng: 14.4, zoom: 10, region: "Europe" },
  { code: "MC", name: "Monaco", nameTr: "Monako", lat: 43.7, lng: 7.4, zoom: 12, region: "Europe" },
  { code: "LI", name: "Liechtenstein", nameTr: "Lihtenştayn", lat: 47.2, lng: 9.6, zoom: 11, region: "Europe" },
  { code: "AD", name: "Andorra", nameTr: "Andorra", lat: 42.5, lng: 1.5, zoom: 11, region: "Europe" },
  { code: "SM", name: "San Marino", nameTr: "San Marino", lat: 43.9, lng: 12.5, zoom: 12, region: "Europe" },
  { code: "VA", name: "Vatican City", nameTr: "Vatikan", lat: 41.9, lng: 12.5, zoom: 14, region: "Europe" },

  // ══════════════════════════════════════════
  // ── Asia (42) ──
  // ══════════════════════════════════════════
  { code: "CN", name: "China", nameTr: "Çin", lat: 35.9, lng: 104.2, zoom: 3.5, region: "Asia" },
  { code: "JP", name: "Japan", nameTr: "Japonya", lat: 36.2, lng: 138.3, zoom: 5, region: "Asia" },
  { code: "KR", name: "South Korea", nameTr: "Güney Kore", lat: 35.9, lng: 127.8, zoom: 6, region: "Asia" },
  { code: "KP", name: "North Korea", nameTr: "Kuzey Kore", lat: 40.3, lng: 127.5, zoom: 6, region: "Asia" },
  { code: "IN", name: "India", nameTr: "Hindistan", lat: 20.6, lng: 79.0, zoom: 4.5, region: "Asia" },
  { code: "PK", name: "Pakistan", nameTr: "Pakistan", lat: 30.4, lng: 69.3, zoom: 5, region: "Asia" },
  { code: "TW", name: "Taiwan", nameTr: "Tayvan", lat: 23.7, lng: 121.0, zoom: 7, region: "Asia" },
  { code: "AF", name: "Afghanistan", nameTr: "Afganistan", lat: 33.9, lng: 67.7, zoom: 5.5, region: "Asia" },
  { code: "MM", name: "Myanmar", nameTr: "Myanmar", lat: 21.9, lng: 95.9, zoom: 5.5, region: "Asia" },
  { code: "BD", name: "Bangladesh", nameTr: "Bangladeş", lat: 23.7, lng: 90.4, zoom: 6.5, region: "Asia" },
  { code: "LK", name: "Sri Lanka", nameTr: "Sri Lanka", lat: 7.9, lng: 80.8, zoom: 7, region: "Asia" },
  { code: "NP", name: "Nepal", nameTr: "Nepal", lat: 28.2, lng: 84.3, zoom: 6.5, region: "Asia" },
  { code: "BT", name: "Bhutan", nameTr: "Butan", lat: 27.5, lng: 90.4, zoom: 8, region: "Asia" },
  { code: "MV", name: "Maldives", nameTr: "Maldivler", lat: 3.2, lng: 73.2, zoom: 6, region: "Asia" },
  { code: "TH", name: "Thailand", nameTr: "Tayland", lat: 15.9, lng: 100.9, zoom: 5.5, region: "Asia" },
  { code: "VN", name: "Vietnam", nameTr: "Vietnam", lat: 14.1, lng: 108.3, zoom: 5.5, region: "Asia" },
  { code: "MY", name: "Malaysia", nameTr: "Malezya", lat: 4.2, lng: 101.9, zoom: 5.5, region: "Asia" },
  { code: "SG", name: "Singapore", nameTr: "Singapur", lat: 1.4, lng: 103.8, zoom: 10, region: "Asia" },
  { code: "ID", name: "Indonesia", nameTr: "Endonezya", lat: -0.8, lng: 113.9, zoom: 4, region: "Asia" },
  { code: "PH", name: "Philippines", nameTr: "Filipinler", lat: 12.9, lng: 121.8, zoom: 5, region: "Asia" },
  { code: "KH", name: "Cambodia", nameTr: "Kamboçya", lat: 12.6, lng: 104.9, zoom: 7, region: "Asia" },
  { code: "LA", name: "Laos", nameTr: "Laos", lat: 19.9, lng: 102.5, zoom: 6, region: "Asia" },
  { code: "BN", name: "Brunei", nameTr: "Brunei", lat: 4.5, lng: 114.7, zoom: 8, region: "Asia" },
  { code: "TL", name: "Timor-Leste", nameTr: "Doğu Timor", lat: -8.9, lng: 125.7, zoom: 8, region: "Asia" },
  { code: "MN", name: "Mongolia", nameTr: "Moğolistan", lat: 46.9, lng: 103.8, zoom: 4.5, region: "Asia" },
  { code: "KZ", name: "Kazakhstan", nameTr: "Kazakistan", lat: 48.0, lng: 68.0, zoom: 4.5, region: "Asia" },
  { code: "UZ", name: "Uzbekistan", nameTr: "Özbekistan", lat: 41.4, lng: 64.6, zoom: 5.5, region: "Asia" },
  { code: "TM", name: "Turkmenistan", nameTr: "Türkmenistan", lat: 38.9, lng: 59.6, zoom: 5.5, region: "Asia" },
  { code: "TJ", name: "Tajikistan", nameTr: "Tacikistan", lat: 38.9, lng: 71.3, zoom: 6.5, region: "Asia" },
  { code: "KG", name: "Kyrgyzstan", nameTr: "Kırgızistan", lat: 41.2, lng: 74.8, zoom: 6.5, region: "Asia" },

  // ══════════════════════════════════════════
  // ── Africa (54) ──
  // ══════════════════════════════════════════
  { code: "NG", name: "Nigeria", nameTr: "Nijerya", lat: 9.1, lng: 8.7, zoom: 5.5, region: "Africa" },
  { code: "EG", name: "Egypt", nameTr: "Mısır", lat: 26.8, lng: 30.8, zoom: 5.5, region: "Africa" },
  { code: "SD", name: "Sudan", nameTr: "Sudan", lat: 12.9, lng: 30.2, zoom: 5, region: "Africa" },
  { code: "ET", name: "Ethiopia", nameTr: "Etiyopya", lat: 9.1, lng: 40.5, zoom: 5.5, region: "Africa" },
  { code: "SO", name: "Somalia", nameTr: "Somali", lat: 5.2, lng: 46.2, zoom: 5.5, region: "Africa" },
  { code: "CD", name: "DR Congo", nameTr: "DR Kongo", lat: -4.0, lng: 21.8, zoom: 5, region: "Africa" },
  { code: "ZA", name: "South Africa", nameTr: "Güney Afrika", lat: -30.6, lng: 22.9, zoom: 5, region: "Africa" },
  { code: "DZ", name: "Algeria", nameTr: "Cezayir", lat: 28.0, lng: 1.7, zoom: 5, region: "Africa" },
  { code: "MA", name: "Morocco", nameTr: "Fas", lat: 31.8, lng: -7.1, zoom: 5.5, region: "Africa" },
  { code: "TN", name: "Tunisia", nameTr: "Tunus", lat: 33.9, lng: 9.5, zoom: 6.5, region: "Africa" },
  { code: "LY", name: "Libya", nameTr: "Libya", lat: 26.3, lng: 17.2, zoom: 5, region: "Africa" },
  { code: "KE", name: "Kenya", nameTr: "Kenya", lat: -0.02, lng: 37.9, zoom: 5.5, region: "Africa" },
  { code: "TZ", name: "Tanzania", nameTr: "Tanzanya", lat: -6.4, lng: 34.9, zoom: 5.5, region: "Africa" },
  { code: "UG", name: "Uganda", nameTr: "Uganda", lat: 1.4, lng: 32.3, zoom: 6.5, region: "Africa" },
  { code: "RW", name: "Rwanda", nameTr: "Ruanda", lat: -1.9, lng: 29.9, zoom: 8, region: "Africa" },
  { code: "BI", name: "Burundi", nameTr: "Burundi", lat: -3.4, lng: 29.9, zoom: 8, region: "Africa" },
  { code: "GH", name: "Ghana", nameTr: "Gana", lat: 7.9, lng: -1.0, zoom: 6, region: "Africa" },
  { code: "CI", name: "Ivory Coast", nameTr: "Fildişi Sahili", lat: 7.5, lng: -5.5, zoom: 6, region: "Africa" },
  { code: "SN", name: "Senegal", nameTr: "Senegal", lat: 14.5, lng: -14.5, zoom: 6.5, region: "Africa" },
  { code: "ML", name: "Mali", nameTr: "Mali", lat: 17.6, lng: -4.0, zoom: 5, region: "Africa" },
  { code: "BF", name: "Burkina Faso", nameTr: "Burkina Faso", lat: 12.3, lng: -1.6, zoom: 6, region: "Africa" },
  { code: "NE", name: "Niger", nameTr: "Nijer", lat: 17.6, lng: 8.1, zoom: 5, region: "Africa" },
  { code: "TD", name: "Chad", nameTr: "Çad", lat: 15.5, lng: 18.7, zoom: 5, region: "Africa" },
  { code: "CM", name: "Cameroon", nameTr: "Kamerun", lat: 7.4, lng: 12.4, zoom: 5.5, region: "Africa" },
  { code: "CF", name: "Central African Republic", nameTr: "Orta Afrika Cumhuriyeti", lat: 6.6, lng: 20.9, zoom: 5.5, region: "Africa" },
  { code: "CG", name: "Republic of Congo", nameTr: "Kongo Cumhuriyeti", lat: -0.2, lng: 15.8, zoom: 6, region: "Africa" },
  { code: "GA", name: "Gabon", nameTr: "Gabon", lat: -0.8, lng: 11.6, zoom: 6.5, region: "Africa" },
  { code: "GQ", name: "Equatorial Guinea", nameTr: "Ekvator Ginesi", lat: 1.6, lng: 10.3, zoom: 8, region: "Africa" },
  { code: "ST", name: "Sao Tome and Principe", nameTr: "Sao Tome ve Principe", lat: 0.2, lng: 6.6, zoom: 9, region: "Africa" },
  { code: "AO", name: "Angola", nameTr: "Angola", lat: -11.2, lng: 17.9, zoom: 5, region: "Africa" },
  { code: "MZ", name: "Mozambique", nameTr: "Mozambik", lat: -18.7, lng: 35.5, zoom: 5, region: "Africa" },
  { code: "ZM", name: "Zambia", nameTr: "Zambiya", lat: -13.1, lng: 27.8, zoom: 5.5, region: "Africa" },
  { code: "ZW", name: "Zimbabwe", nameTr: "Zimbabve", lat: -19.0, lng: 29.2, zoom: 6, region: "Africa" },
  { code: "MW", name: "Malawi", nameTr: "Malavi", lat: -13.3, lng: 34.3, zoom: 6, region: "Africa" },
  { code: "BW", name: "Botswana", nameTr: "Botsvana", lat: -22.3, lng: 24.7, zoom: 5.5, region: "Africa" },
  { code: "NA", name: "Namibia", nameTr: "Namibya", lat: -22.6, lng: 17.1, zoom: 5, region: "Africa" },
  { code: "SZ", name: "Eswatini", nameTr: "Esvatini", lat: -26.5, lng: 31.5, zoom: 8, region: "Africa" },
  { code: "LS", name: "Lesotho", nameTr: "Lesoto", lat: -29.6, lng: 28.2, zoom: 8, region: "Africa" },
  { code: "MG", name: "Madagascar", nameTr: "Madagaskar", lat: -18.8, lng: 46.9, zoom: 5, region: "Africa" },
  { code: "MU", name: "Mauritius", nameTr: "Mauritius", lat: -20.3, lng: 57.6, zoom: 9, region: "Africa" },
  { code: "KM", name: "Comoros", nameTr: "Komorlar", lat: -11.9, lng: 43.9, zoom: 8, region: "Africa" },
  { code: "SC", name: "Seychelles", nameTr: "Seyşeller", lat: -4.7, lng: 55.5, zoom: 8, region: "Africa" },
  { code: "DJ", name: "Djibouti", nameTr: "Cibuti", lat: 11.6, lng: 43.1, zoom: 8, region: "Africa" },
  { code: "ER", name: "Eritrea", nameTr: "Eritre", lat: 15.2, lng: 39.8, zoom: 6.5, region: "Africa" },
  { code: "SS", name: "South Sudan", nameTr: "Güney Sudan", lat: 6.9, lng: 31.3, zoom: 5.5, region: "Africa" },
  { code: "MR", name: "Mauritania", nameTr: "Moritanya", lat: 21.0, lng: -10.9, zoom: 5, region: "Africa" },
  { code: "GM", name: "Gambia", nameTr: "Gambiya", lat: 13.4, lng: -15.3, zoom: 8, region: "Africa" },
  { code: "GW", name: "Guinea-Bissau", nameTr: "Gine-Bissau", lat: 11.8, lng: -15.2, zoom: 7.5, region: "Africa" },
  { code: "GN", name: "Guinea", nameTr: "Gine", lat: 9.9, lng: -11.7, zoom: 6, region: "Africa" },
  { code: "SL", name: "Sierra Leone", nameTr: "Sierra Leone", lat: 8.5, lng: -11.8, zoom: 7, region: "Africa" },
  { code: "LR", name: "Liberia", nameTr: "Liberya", lat: 6.4, lng: -9.4, zoom: 7, region: "Africa" },
  { code: "TG", name: "Togo", nameTr: "Togo", lat: 8.6, lng: 0.8, zoom: 7, region: "Africa" },
  { code: "BJ", name: "Benin", nameTr: "Benin", lat: 9.3, lng: 2.3, zoom: 6.5, region: "Africa" },
  { code: "CV", name: "Cape Verde", nameTr: "Yeşil Burun Adaları", lat: 16.0, lng: -24.0, zoom: 7, region: "Africa" },

  // ══════════════════════════════════════════
  // ── North America (3) ──
  // ══════════════════════════════════════════
  { code: "US", name: "United States", nameTr: "ABD", lat: 37.1, lng: -95.7, zoom: 3.5, region: "North America" },
  { code: "CA", name: "Canada", nameTr: "Kanada", lat: 56.1, lng: -106.3, zoom: 3, region: "North America" },
  { code: "MX", name: "Mexico", nameTr: "Meksika", lat: 23.6, lng: -102.6, zoom: 4.5, region: "North America" },

  // ══════════════════════════════════════════
  // ── Central America (7) ──
  // ══════════════════════════════════════════
  { code: "GT", name: "Guatemala", nameTr: "Guatemala", lat: 15.8, lng: -90.2, zoom: 7, region: "Central America" },
  { code: "BZ", name: "Belize", nameTr: "Belize", lat: 17.2, lng: -88.5, zoom: 7.5, region: "Central America" },
  { code: "HN", name: "Honduras", nameTr: "Honduras", lat: 15.2, lng: -86.2, zoom: 7, region: "Central America" },
  { code: "SV", name: "El Salvador", nameTr: "El Salvador", lat: 13.8, lng: -88.9, zoom: 8, region: "Central America" },
  { code: "NI", name: "Nicaragua", nameTr: "Nikaragua", lat: 12.9, lng: -85.2, zoom: 7, region: "Central America" },
  { code: "CR", name: "Costa Rica", nameTr: "Kosta Rika", lat: 9.7, lng: -83.8, zoom: 7.5, region: "Central America" },
  { code: "PA", name: "Panama", nameTr: "Panama", lat: 8.5, lng: -80.8, zoom: 7, region: "Central America" },

  // ══════════════════════════════════════════
  // ── Caribbean (13) ──
  // ══════════════════════════════════════════
  { code: "CU", name: "Cuba", nameTr: "Küba", lat: 21.5, lng: -77.8, zoom: 6, region: "Caribbean" },
  { code: "JM", name: "Jamaica", nameTr: "Jamaika", lat: 18.1, lng: -77.3, zoom: 8, region: "Caribbean" },
  { code: "HT", name: "Haiti", nameTr: "Haiti", lat: 19.0, lng: -72.3, zoom: 7.5, region: "Caribbean" },
  { code: "DO", name: "Dominican Republic", nameTr: "Dominik Cumhuriyeti", lat: 18.7, lng: -70.2, zoom: 7.5, region: "Caribbean" },
  { code: "TT", name: "Trinidad and Tobago", nameTr: "Trinidad ve Tobago", lat: 10.7, lng: -61.2, zoom: 8, region: "Caribbean" },
  { code: "BB", name: "Barbados", nameTr: "Barbados", lat: 13.2, lng: -59.5, zoom: 10, region: "Caribbean" },
  { code: "BS", name: "Bahamas", nameTr: "Bahamalar", lat: 25.0, lng: -77.4, zoom: 6.5, region: "Caribbean" },
  { code: "AG", name: "Antigua and Barbuda", nameTr: "Antigua ve Barbuda", lat: 17.1, lng: -61.8, zoom: 10, region: "Caribbean" },
  { code: "DM", name: "Dominica", nameTr: "Dominika", lat: 15.4, lng: -61.4, zoom: 10, region: "Caribbean" },
  { code: "GD", name: "Grenada", nameTr: "Grenada", lat: 12.3, lng: -61.7, zoom: 10, region: "Caribbean" },
  { code: "KN", name: "Saint Kitts and Nevis", nameTr: "Saint Kitts ve Nevis", lat: 17.3, lng: -62.7, zoom: 10, region: "Caribbean" },
  { code: "LC", name: "Saint Lucia", nameTr: "Saint Lucia", lat: 13.9, lng: -61.0, zoom: 10, region: "Caribbean" },
  { code: "VC", name: "Saint Vincent and the Grenadines", nameTr: "Saint Vincent ve Grenadinler", lat: 13.3, lng: -61.2, zoom: 10, region: "Caribbean" },

  // ══════════════════════════════════════════
  // ── South America (12) ──
  // ══════════════════════════════════════════
  { code: "BR", name: "Brazil", nameTr: "Brezilya", lat: -14.2, lng: -51.9, zoom: 3.5, region: "South America" },
  { code: "CO", name: "Colombia", nameTr: "Kolombiya", lat: 4.6, lng: -74.3, zoom: 5, region: "South America" },
  { code: "VE", name: "Venezuela", nameTr: "Venezuela", lat: 6.4, lng: -66.6, zoom: 5.5, region: "South America" },
  { code: "AR", name: "Argentina", nameTr: "Arjantin", lat: -38.4, lng: -63.6, zoom: 4, region: "South America" },
  { code: "CL", name: "Chile", nameTr: "Şili", lat: -35.7, lng: -71.5, zoom: 4, region: "South America" },
  { code: "PE", name: "Peru", nameTr: "Peru", lat: -9.2, lng: -75.0, zoom: 5, region: "South America" },
  { code: "EC", name: "Ecuador", nameTr: "Ekvador", lat: -1.8, lng: -78.2, zoom: 6.5, region: "South America" },
  { code: "BO", name: "Bolivia", nameTr: "Bolivya", lat: -16.3, lng: -63.6, zoom: 5.5, region: "South America" },
  { code: "PY", name: "Paraguay", nameTr: "Paraguay", lat: -23.4, lng: -58.4, zoom: 5.5, region: "South America" },
  { code: "UY", name: "Uruguay", nameTr: "Uruguay", lat: -32.5, lng: -55.8, zoom: 6.5, region: "South America" },
  { code: "GY", name: "Guyana", nameTr: "Guyana", lat: 4.9, lng: -58.9, zoom: 6, region: "South America" },
  { code: "SR", name: "Suriname", nameTr: "Surinam", lat: 3.9, lng: -56.0, zoom: 7, region: "South America" },

  // ══════════════════════════════════════════
  // ── Oceania (14) ──
  // ══════════════════════════════════════════
  { code: "AU", name: "Australia", nameTr: "Avustralya", lat: -25.3, lng: 133.8, zoom: 3.5, region: "Oceania" },
  { code: "NZ", name: "New Zealand", nameTr: "Yeni Zelanda", lat: -40.9, lng: 174.9, zoom: 5, region: "Oceania" },
  { code: "PG", name: "Papua New Guinea", nameTr: "Papua Yeni Gine", lat: -6.3, lng: 147.2, zoom: 5.5, region: "Oceania" },
  { code: "FJ", name: "Fiji", nameTr: "Fiji", lat: -18.0, lng: 179.0, zoom: 7, region: "Oceania" },
  { code: "SB", name: "Solomon Islands", nameTr: "Solomon Adaları", lat: -9.4, lng: 160.0, zoom: 6, region: "Oceania" },
  { code: "VU", name: "Vanuatu", nameTr: "Vanuatu", lat: -15.4, lng: 166.9, zoom: 6.5, region: "Oceania" },
  { code: "WS", name: "Samoa", nameTr: "Samoa", lat: -13.8, lng: -172.1, zoom: 8, region: "Oceania" },
  { code: "KI", name: "Kiribati", nameTr: "Kiribati", lat: 1.9, lng: -157.5, zoom: 5, region: "Oceania" },
  { code: "TO", name: "Tonga", nameTr: "Tonga", lat: -21.2, lng: -175.2, zoom: 8, region: "Oceania" },
  { code: "FM", name: "Micronesia", nameTr: "Mikronezya", lat: 7.4, lng: 150.6, zoom: 5, region: "Oceania" },
  { code: "MH", name: "Marshall Islands", nameTr: "Marshall Adaları", lat: 7.1, lng: 171.2, zoom: 6, region: "Oceania" },
  { code: "PW", name: "Palau", nameTr: "Palau", lat: 7.5, lng: 134.6, zoom: 8, region: "Oceania" },
  { code: "NR", name: "Nauru", nameTr: "Nauru", lat: -0.5, lng: 166.9, zoom: 12, region: "Oceania" },
  { code: "TV", name: "Tuvalu", nameTr: "Tuvalu", lat: -7.1, lng: 177.6, zoom: 8, region: "Oceania" },
];

/** Quick lookup by country code */
export const COUNTRY_MAP = new Map(COUNTRIES.map((c) => [c.code, c]));

/** All unique regions */
export const REGIONS = [...new Set(COUNTRIES.map((c) => c.region))];
