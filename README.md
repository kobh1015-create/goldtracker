# GoldTracker - 한국 사금 탐사 지원 웹앱

한국 내 사금 탐사를 돕는 지형 분석 및 기록용 인터랙티브 웹 애플리케이션입니다.  
과거 금광 위치 데이터와 지형 데이터를 결합하여 유망한 사금 채취 포인트를 추천합니다.

---

## 주요 기능

### 지도 & 시각화
- **인터랙티브 지도**: Leaflet.js + OpenStreetMap 기반의 지도 뷰
- **폐광산 마커**: 국내 과거 금광/폐광산 위치 데이터를 지도 위에 마커로 표시
- **하천 Point Bar 시각화**: 사금이 퇴적되기 유리한 하천 굽이(Point Bar) 구간 강조 표시

### 스팟 탐색
- **웹 검색 연동**: 유튜브, 사금 관련 카페 등 커뮤니티의 최신 사금 채취 스팟 정보를 검색·업데이트
- **유망 포인트 분석**: 비중 원리(사금의 고비중 특성)에 기반한 퇴적 가능성 분석 알고리즘 적용

### 개인 기록
- **사금 발견 기록**: 발견 위치(좌표), 사진, 채취량을 입력하여 저장
- **Local Storage 활용**: 별도 서버 없이 브라우저에 데이터 영구 저장

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Vite + React (SWC) |
| 스타일링 | Tailwind CSS |
| 지도 | Leaflet.js, react-leaflet |
| 아이콘 | Lucide React |
| 데이터 저장 | Browser Local Storage |

---

## 개발 로드맵

```
Phase 1 - 환경 구축
  ├── Vite + React + SWC 프로젝트 초기화
  ├── Tailwind CSS 설정
  └── 라이브러리 설치 (leaflet, react-leaflet, lucide-react)

Phase 2 - 지도 구현
  ├── Leaflet 지도 컴포넌트 구성
  ├── 레이어 컨트롤 (위성/일반 지도 전환)
  └── 현재 위치 표시 기능

Phase 3 - 데이터 매핑
  ├── 폐광산 데이터 JSON 구축 및 마커 표시
  ├── Point Bar 구간 폴리라인/폴리곤 표시
  └── 유망 포인트 분석 알고리즘 구현

Phase 4 - 기록 기능 추가
  ├── 사금 발견 기록 폼 (위치, 사진, 양)
  ├── Local Storage CRUD
  └── 기록 목록 및 지도 마커 연동
```

---

## 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

---

## 프로젝트 구조 (목표)

```
사금 지도/
├── public/
│   └── data/
│       └── gold_mines.json       # 폐광산 위치 데이터
├── src/
│   ├── components/
│   │   ├── Map/
│   │   │   ├── GoldMap.jsx       # 메인 지도 컴포넌트
│   │   │   ├── MineMarker.jsx    # 폐광산 마커
│   │   │   └── PointBarLayer.jsx # 하천 굽이 레이어
│   │   ├── Sidebar/
│   │   │   ├── SpotSearch.jsx    # 웹 스팟 검색
│   │   │   └── RecordList.jsx    # 발견 기록 목록
│   │   └── RecordForm.jsx        # 사금 기록 입력 폼
│   ├── hooks/
│   │   └── useLocalStorage.js    # Local Storage 커스텀 훅
│   ├── utils/
│   │   └── goldAnalysis.js       # 유망 포인트 분석 로직
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 사금 포인트 분석 원리

사금(砂金)은 비중이 약 15~19로 매우 높아 하천 흐름 속에서 다음 조건의 지점에 퇴적됩니다:

1. **Point Bar**: 하천 굽이의 안쪽 퇴적사면 — 유속 감소로 비중 높은 물질 먼저 퇴적
2. **폭포/여울 하류**: 유속 급감 구간에서 비중 입자 집중
3. **합류부**: 두 하천이 만나는 지점의 유속 저하 구간
4. **과거 금광 인근 하류**: 금맥 침식에 의한 자연 공급원 존재 가능성

이 네 가지 요소를 지도 데이터와 교차 분석하여 유망도를 점수화합니다.
