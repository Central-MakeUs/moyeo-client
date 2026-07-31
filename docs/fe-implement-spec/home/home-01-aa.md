좋아. 이번부터는 이전에 합의한 템플릿과 톤을 그대로 유지할게.

---

# HOME-01-AA

## 1. 화면 개요

| 항목      | 내용                                  |
| --------- | ------------------------------------- |
| Domain    | HOME                                  |
| 화면 ID   | HOME-01-AA                            |
| 화면명    | 저장할 출발지 입력                    |
| Owner     | planning                              |
| 관련 화면 | HOME-01-A, HOME-01-AA-1, HOME-01-AA-2 |

### 목적

사용자가 자주 사용하는 출발지를 저장하기 위해

- 주소 검색 또는 현재 위치 검색
- 출발지 라벨 선택
- 저장

과정을 수행하는 화면이다.

---

# 2. 기획 식별자

## HOME-01-AA-1 (출발지 검색)

| ID               | Owner    | 기능               | 설명                        |
| ---------------- | -------- | ------------------ | --------------------------- |
| HOME-01-AA       | planning | 저장할 출발지 입력 | 출발지 저장 Flow            |
| HOME-01-AA-1     | planning | 출발지 검색        | 주소 검색 단계              |
| HOME-01-AA-1-F01 | planning | 주소 검색 및 입력  | 검색 결과 표시 및 주소 선택 |
| HOME-01-AA-1-F02 | planning | 현재 위치로 찾기   | GPS 기반 주소 검색          |
| HOME-01-AA-1-F03 | planning | 뒤로가기           | HOME-01-A 이동              |

---

## HOME-01-AA-2 (출발지 라벨 선택)

| ID               | Owner    | 기능             | 설명                   |
| ---------------- | -------- | ---------------- | ---------------------- |
| HOME-01-AA-2     | planning | 출발지 라벨 선택 | 저장할 라벨 지정       |
| HOME-01-AA-2-F01 | planning | 라벨 선택        | 집 / 회사 / 직접입력   |
| HOME-01-AA-2-F02 | planning | 저장 버튼        | 저장 후 HOME-01-A 이동 |
| HOME-01-AA-2-F03 | planning | 뒤로가기         | HOME-01-AA-1 이동      |

---

# 3. 화면 흐름

```text
HOME-01-A

↓

HOME-01-AA-1

├── 주소 검색
│      ↓
│   주소 선택
│      ↓
│
├── 현재 위치
│      ↓
│
└─────────────┐
              │
              ▼

HOME-01-AA-2

├── 집

├── 회사

├── 직접입력

↓

저장

↓

HOME-01-A
```

---

# 4. Wireframe 분석

## HOME-01-AA-1 (주소 입력)

확인 가능한 요소

- 뒤로가기
- 검색 Input
- 현재 위치 찾기 버튼

검색 전에는 결과 리스트가 존재하지 않는다.

---

## HOME-01-AA-1 (주소 검색)

검색어 입력 시

- 검색 결과 리스트 노출
- 키보드 표시
- 주소 선택 가능

주소 선택 시

다음 단계로 이동한다.

---

## HOME-01-AA-2 (라벨 선택)

확인 가능한 요소

- 선택한 주소 표시
- 집
- 회사
- 직접입력
- 저장 버튼

집/회사 선택 시

텍스트 입력 없이 저장 가능하다.

---

## HOME-01-AA-2 (직접입력)

직접입력 선택 시

추가 Input 노출

placeholder

```text
예) 모여네 집
```

저장 버튼 존재

---

# 5. 기획 ↔ Wireframe 비교

| 기능      | 기획 | Wireframe | 결과 |
| --------- | ---- | --------- | ---- |
| 주소 검색 | ✅   | ✅        | 일치 |
| 검색 결과 | ✅   | ✅        | 일치 |
| 현재 위치 | ✅   | ✅        | 일치 |
| 라벨 선택 | ✅   | ✅        | 일치 |
| 직접입력  | ✅   | ✅        | 일치 |
| 저장      | ✅   | ✅        | 일치 |
| 뒤로가기  | ✅   | ✅        | 일치 |

특별한 불일치는 확인되지 않는다.

---

# 6. UI States

## HOME-01-AA-1

### Default

검색 전

---

### Searching

검색어 입력 중

---

### Search Result

검색 결과 표시

---

### GPS Searching

현재 위치 검색 중

---

## HOME-01-AA-2

### Label Selected

집 / 회사 선택

---

### Custom Label

직접입력 선택

Input 표시

---

### Saving

저장 요청

---

# 7. Frontend 후보

> owner: frontend

| ID                       | 상태      | 설명      |
| ------------------------ | --------- | --------- |
| HOME-01-AA/search        | candidate | 주소 검색 |
| HOME-01-AA/search-result | candidate | 검색 결과 |
| HOME-01-AA/location      | candidate | 현재 위치 |
| HOME-01-AA/label         | candidate | 라벨 선택 |
| HOME-01-AA/custom-label  | candidate | 직접입력  |

---

# 8. Route 후보

```text
HOME-01-A

↓

HOME-01-AA/search

↓

HOME-01-AA/label

↓

HOME-01-A
```

※ 실제 구현에서는 하나의 Route에서 Step State로 관리할 가능성도 있음.

---

# 9. Component 후보

## Search

- DepartureSearchInput
- SearchResultList
- SearchResultItem

---

## GPS

- CurrentLocationButton

---

## Label

- DepartureLabelChip
- CustomLabelInput

---

## Common

- SaveButton
- BackButton

---

# 10. API 영향

## 주소 검색

예상

```http
GET /locations/search?keyword=
```

또는

```http
GET /places/search
```

※ 실제로는 카카오 로컬 API 등 외부 API를 사용할 가능성이 높다.

---

## 현재 위치

GPS 권한 요청

↓

좌표 획득

↓

역지오코딩

↓

주소 반환

---

## 저장

예상

```http
POST /departure
```

---

### 미확인

- 실제 API 명세
- 외부 지도 서비스 사용 여부
- 좌표 저장 여부

---

# 11. 상태(State)

## Search

- Idle
- Searching
- Result
- No Result

---

## GPS

- Permission Request
- Searching
- Success
- Failure

---

## Label

- None
- Home
- Company
- Custom

---

## Save

- Disabled
- Enabled
- Saving
- Success
- Failure

---

# 12. Edge Case

- 검색 결과 없음
- GPS 권한 거부
- GPS 사용 불가
- 주소 검색 실패
- 동일한 주소 저장
- 직접입력 공백
- 직접입력 최대 길이
- 저장 실패
- 네트워크 오류
- 뒤로가기 후 재진입

---

# 13. QA

### 검색

- 검색 결과 표시
- 결과 선택
- 결과 없음

---

### 현재 위치

- 권한 허용
- 권한 거부
- 주소 정상 변환

---

### 라벨

- 집 선택
- 회사 선택
- 직접입력
- 입력 Validation

---

### 저장

- 저장 버튼 활성화
- 저장 성공
- HOME-01-A 복귀

---

### Navigation

- 뒤로가기
- HOME-01-A 이동

---

# 14. unresolved

### 1. 검색 방식

기획에는 "주소 검색"만 명시되어 있으며, 검색 API 또는 지도 서비스(예: 카카오, 네이버 등)는 명시되어 있지 않다.

→ **기술/API 결정 필요**

---

### 2. 현재 위치 검색 실패 처리

GPS 권한 거부, 위치 탐색 실패, 역지오코딩 실패 시의 UI 및 오류 메시지가 정의되어 있지 않다.

→ **기획 확인 필요**

---

### 3. 직접입력 Validation

직접입력 라벨의 최대 길이, 허용 문자, 중복 여부가 명시되어 있지 않다.

→ **기획 확인 필요**

---

### 4. 저장 완료 피드백

저장 후 즉시 HOME-01-A로 이동한다고만 정의되어 있으며, 토스트 메시지나 성공 피드백 제공 여부는 정의되어 있지 않다.

→ **기획 확인 필요**
