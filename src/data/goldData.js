// 출처: USGS Mineral Resources Data System (MRDS) - GPS 좌표 검증 완료
// goldRank 1 = 금이 주 생산물, goldRank 2 = 금이 부산물(구리·은 광산에 동반)
export const MINES = [
  // ─── 1순위: 금이 주 생산물 ───────────────────────────────────────
  { id: 1,  goldRank: 1, name: '구봉금광', lat: 36.41519, lng: 126.76567, region: '충남 청양군', river: '지천',    address: '충남 청양군 남양면 구룡리', notes: '금/은 — 동양 최대 규모' },
  { id: 2,  goldRank: 1, name: '임천금광', lat: 36.24853, lng: 126.89900, region: '충남 부여군', river: '금강',    address: '충남 부여군 임천면',        notes: '금/은' },
  { id: 3,  goldRank: 1, name: '예산금광', lat: 36.49851, lng: 126.78233, region: '충남 예산군', river: '삽교천',  address: '충남 예산군',               notes: '금' },
  { id: 4,  goldRank: 1, name: '덕음금광', lat: 34.99861, lng: 126.59903, region: '전남 영광군', river: '불갑천',  address: '전남 영광군',               notes: '금/은' },
  { id: 5,  goldRank: 1, name: '김제금광', lat: 35.74856, lng: 126.91568, region: '전북 김제시', river: '동진강',  address: '전북 김제시',               notes: '금/은' },
  { id: 6,  goldRank: 1, name: '월류금광', lat: 36.22632, lng: 127.89481, region: '충북 옥천군', river: '보청천',  address: '충북 옥천군',               notes: '금/은' },
  { id: 7,  goldRank: 1, name: '무극금광', lat: 36.98182, lng: 127.41565, region: '충북 음성군', river: '청미천',  address: '충북 음성군',               notes: '금/은/구리' },
  { id: 8,  goldRank: 1, name: '성남금광', lat: 36.71518, lng: 127.49898, region: '충북 청주시', river: '미호천',  address: '충북 청주시',               notes: '금' },
  { id: 10, goldRank: 1, name: '군북금광', lat: 35.21527, lng: 128.34898, region: '경남 합천군', river: '황강',    address: '경남 합천군',               notes: '금/은/구리' },

  // ─── 2순위: Cu-Au 광상 (구리 주, 금 동반) ────────────────────────
  { id: 11, goldRank: 2, name: '동진광산', lat: 35.71523, lng: 127.31567, region: '전북 완주군', river: '만경강',  address: '전북 완주군',               notes: '구리/금/은' },
  { id: 12, goldRank: 2, name: '일광금광', lat: 35.30416, lng: 129.22674, region: '부산 기장군', river: '일광천',  address: '부산 기장군 일광읍',        notes: '구리/은/금' },
  { id: 13, goldRank: 2, name: '고흥광산', lat: 34.59863, lng: 127.24901, region: '전남 고흥군', river: '고흥천',  address: '전남 고흥군',               notes: '구리/금/은' },
  { id: 14, goldRank: 2, name: '고성광산', lat: 35.16527, lng: 128.59897, region: '경남 고성군', river: '남해안',  address: '경남 고성군',               notes: '구리/금/은' },
  { id: 15, goldRank: 2, name: '광용광산', lat: 36.94850, lng: 128.16563, region: '충북 제천시', river: '달천',    address: '충북 제천시',               notes: '구리/은/금' },
  { id: 16, goldRank: 2, name: '동성광산', lat: 35.05694, lng: 128.59064, region: '경남 창원시', river: '낙동강',  address: '경남 창원시 마산',          notes: '구리/금/은' },
  { id: 17, goldRank: 2, name: '부용광산', lat: 34.66530, lng: 127.99900, region: '전남 여수시', river: '남해안',  address: '전남 여수시',               notes: '구리/금/은' },
  { id: 18, goldRank: 2, name: '함창광산', lat: 37.33182, lng: 128.73227, region: '강원 영월군', river: '남한강',  address: '강원 영월군',               notes: '납/아연/금/은' },
  { id: 19, goldRank: 2, name: '대덕광산', lat: 34.89862, lng: 128.26565, region: '경남 통영시', river: '남해안',  address: '경남 통영시',               notes: '구리/은/금' },
  { id: 20, goldRank: 2, name: '수복광산', lat: 36.19854, lng: 127.44899, region: '충남 공주시', river: '금강',    address: '충남 공주시',               notes: '구리/아연/은/금' },
]

// 각 1순위 광산 5km 내외 하류 Point Bar
export const POINT_BARS = [
  { id: 'pb1',  name: '지천 구봉 하류 굽이',   river: '지천',    address: '충남 청양군 청양읍', coords: [[36.4351,126.7901],[36.4391,126.7971],[36.4361,126.8051]] },
  { id: 'pb2',  name: '금강 임천 하류 굽이',   river: '금강',    address: '충남 부여군 임천면', coords: [[36.2481,126.8401],[36.2521,126.8471],[36.2491,126.8551]] },
  { id: 'pb3',  name: '삽교천 예산 하류 굽이', river: '삽교천',  address: '충남 예산군',        coords: [[36.5401,126.7781],[36.5441,126.7851],[36.5411,126.7931]] },
  { id: 'pb4',  name: '보청천 월류 하류 굽이', river: '보청천',  address: '충북 옥천군',        coords: [[36.2481,127.8631],[36.2521,127.8701],[36.2491,127.8781]] },
  { id: 'pb5',  name: '청미천 무극 하류 굽이', river: '청미천',  address: '충북 음성군',        coords: [[37.0191,127.4121],[37.0231,127.4191],[37.0201,127.4271]] },
  { id: 'pb7',  name: '만경강 동진 하류 굽이', river: '만경강',  address: '전북 완주군',        coords: [[35.7121,127.2581],[35.7161,127.2651],[35.7131,127.2731]] },
  { id: 'pb8',  name: '일광천 하류 굽이',      river: '일광천',  address: '부산 기장군 일광읍', coords: [[35.2771,129.2281],[35.2811,129.2351],[35.2781,129.2431]] },
  { id: 'pb9',  name: '금강 수복 하류 굽이',   river: '금강',    address: '충남 공주시',        coords: [[36.1961,127.3911],[36.2001,127.3981],[36.1971,127.4061]] },
  { id: 'pb10', name: '황강 군북 하류 굽이',   river: '황강',    address: '경남 합천군',        coords: [[35.2121,128.3441],[35.2161,128.3511],[35.2131,128.3591]] },
  { id: 'pb11', name: '달천 광용 하류 굽이',   river: '달천',    address: '충북 제천시',        coords: [[36.9911,128.1621],[36.9951,128.1691],[36.9921,128.1771]] },
  { id: 'pb12', name: '남한강 함창 하류 굽이', river: '남한강',  address: '강원 영월군',        coords: [[37.3291,128.6741],[37.3331,128.6811],[37.3301,128.6891]] },
]

export const CONFLUENCES = [
  { id: 'c1', name: '섬진강+보성강 합류', lat: 35.2831, lng: 127.2981, address: '전남 곡성군 겸면',   rivers: ['섬진강', '보성강'] },
  { id: 'c2', name: '금강+갑천 합류',     lat: 36.4121, lng: 127.2581, address: '충남 공주시 반포면', rivers: ['금강', '갑천']    },
  { id: 'c3', name: '낙동강+남강 합류',   lat: 35.2481, lng: 128.3941, address: '경남 함안군 칠서면', rivers: ['낙동강', '남강']  },
  { id: 'c4', name: '홍천강+북한강 합류', lat: 37.8731, lng: 127.7421, address: '강원 춘천시 서면',   rivers: ['홍천강', '북한강'] },
  { id: 'c5', name: '임진강+한탄강 합류', lat: 38.1181, lng: 126.9941, address: '경기 연천군 전곡읍', rivers: ['임진강', '한탄강'] },
  { id: 'c6', name: '금강+지천 합류',     lat: 36.4351, lng: 126.8821, address: '충남 청양군 청양읍', rivers: ['금강', '지천']    },
]

// 1순위 광산 위주 하류 유망 구간
export const CANDIDATES = [
  { id: 'hot1',  name: '구봉금광 하류 지천',   lat: 36.4401, lng: 126.7971, address: '충남 청양군 청양읍 지천변'   },
  { id: 'hot2',  name: '임천금광 하류 금강',   lat: 36.2491, lng: 126.8431, address: '충남 부여군 임천면 금강변'   },
  { id: 'hot3',  name: '예산금광 하류 삽교천', lat: 36.5431, lng: 126.7821, address: '충남 예산군 삽교천변'        },
  { id: 'hot4',  name: '덕음금광 하류 불갑천', lat: 34.9991, lng: 126.5431, address: '전남 영광군 불갑천변'        },
  { id: 'hot5',  name: '김제금광 하류 동진강', lat: 35.7491, lng: 126.8601, address: '전북 김제시 동진강변'        },
  { id: 'hot6',  name: '월류금광 하류 보청천', lat: 36.2481, lng: 127.8671, address: '충북 옥천군 보청천변'        },
  { id: 'hot7',  name: '무극금광 하류 청미천', lat: 37.0191, lng: 127.4161, address: '충북 음성군 청미천변'        },
  { id: 'hot8',  name: '성남금광 하류 미호천', lat: 36.7151, lng: 127.4431, address: '충북 청주시 미호천변'        },
  { id: 'hot10', name: '군북금광 하류 황강',   lat: 35.2121, lng: 128.3481, address: '경남 합천군 황강변'          },
  { id: 'hot11', name: '일광금광 하류 일광천', lat: 35.2771, lng: 129.2381, address: '부산 기장군 일광천변'        },
  { id: 'hot12', name: '수복광산 하류 금강',   lat: 36.1991, lng: 127.3931, address: '충남 공주시 금강변'          },
  { id: 'hot13', name: '동진광산 하류 만경강', lat: 35.7151, lng: 127.2601, address: '전북 완주군 만경강변'        },
  { id: 'hot14', name: '광용광산 하류 달천',   lat: 36.9941, lng: 128.1661, address: '충북 제천시 달천변'          },
  { id: 'hot15', name: '함창광산 하류 남한강', lat: 37.3321, lng: 128.6781, address: '강원 영월군 남한강변'        },
]
