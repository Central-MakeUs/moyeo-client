# HOME-01-A

## 1. 화면 개요

| 항목      | 내용                |
| --------- | ------------------- |
| Domain    | HOME                |
| 화면 ID   | HOME-01-A           |
| 화면명    | 마이페이지          |
| Owner     | planning            |
| 관련 화면 | HOME-01, HOME-01-AB |

### 목적

사용자의 계정 정보를 확인하고,

- 프로필 이미지 수정
- 기본 닉네임 수정
- 저장한 출발지 관리

를 수행하는 화면이다.

---

# 2. 기획 식별자

| ID            | Owner    | 기능                  | 설명                                    |
| ------------- | -------- | --------------------- | --------------------------------------- |
| HOME-01-A     | planning | 마이페이지            | 사용자 정보 및 출발지 관리              |
| HOME-01-A-F01 | planning | 계정 정보 표시        | 아이디, 기본 닉네임, 프로필 이미지 표시 |
| HOME-01-A-F02 | planning | 프로필 수정 버튼      | 프로필 선택 모달 표시                   |
| HOME-01-A-F03 | planning | 기본 닉네임 수정 버튼 | 닉네임 수정 모달 표시                   |
| HOME-01-A-F04 | planning | 저장된 출발지 리스트  | 저장된 출발지 목록 표시 및 삭제         |
| HOME-01-A-F05 | planning | 출발지 추가 버튼      | HOME-01-AB 이동                         |
| HOME-01-A-F06 | planning | 뒤로가기 버튼         | HOME-01 이동                            |

---

# 3. 화면 흐름

```text
HOME-01

↓

HOME-01-A

├── 프로필 수정
│      ↓
│   프로필 선택 모달
│
├── 닉네임 수정
│      ↓
│   닉네임 수정 모달
│
├── 출발지 삭제
│
├── 출발지 추가
│      ↓
│   HOME-01-AB
│
└── 뒤로가기
       ↓
    HOME-01
```

---

# 4. Wireframe 분석

## Default

확인 가능한 요소

- 뒤로가기
- 프로필 이미지
- 기본 닉네임
- 저장된 출발지 목록
- 출발지 추가 버튼

출발지는

- 아이콘
- 라벨
- 상세 주소
- 삭제 버튼(X)

으로 구성된다.

---

## 프로필 수정

프로필 클릭 시

Bottom Sheet 형태의 모달 표시

확인 가능한 요소

- 기본 프로필 4종
- 취소
- 완료

기획과 일치

---

## 닉네임 수정

닉네임 클릭 시

Bottom Sheet 표시

확인 가능한 요소

- 입력창
- 안내 문구
- 취소
- 완료

안내 문구

> 모임별 닉네임 수정은 모임 상세페이지에서 가능합니다.

기획 내용과 일치

---

# 5. 기획 ↔ Wireframe 비교

| 기능          | 기획 | Wireframe | 결과 |
| ------------- | ---- | --------- | ---- |
| 계정 정보     | ✅   | ✅        | 일치 |
| 프로필 수정   | ✅   | ✅        | 일치 |
| 닉네임 수정   | ✅   | ✅        | 일치 |
| 출발지 리스트 | ✅   | ✅        | 일치 |
| 출발지 삭제   | ✅   | ✅        | 일치 |
| 출발지 추가   | ✅   | ✅        | 일치 |
| 뒤로가기      | ✅   | ✅        | 일치 |

특별한 누락은 발견되지 않는다.

---

# 6. UI States

## Default

사용자 정보 표시

---

## Profile Edit

프로필 선택 Bottom Sheet

---

## Nickname Edit

닉네임 수정 Bottom Sheet

---

## Empty Departure List

### 미확인

기획과 Wireframe 모두 저장된 출발지가 없는 상태를 표현하지 않는다.

---

# 7. Frontend 후보

> owner: frontend

| ID                       | 상태      | 설명                     |
| ------------------------ | --------- | ------------------------ |
| HOME-01-A/default        | candidate | 기본 화면                |
| HOME-01-A/profile-sheet  | candidate | 프로필 선택 Bottom Sheet |
| HOME-01-A/nickname-sheet | candidate | 닉네임 수정 Bottom Sheet |
| HOME-01-A/departure-list | candidate | 출발지 목록              |

---

# 8. Route 후보

```text
HOME-01

↓

HOME-01-A

↓

HOME-01-AB
```

---

# 9. Component 후보

## Header

- BackButton
- MyPageHeader

---

## Profile

- ProfileAvatar
- ProfileEditButton

---

## Nickname

- NicknameDisplay
- NicknameEditButton

---

## Departure

- DepartureList
- DepartureCard
- DepartureDeleteButton
- AddDepartureButton

---

## BottomSheet

- ProfileSelectSheet
- NicknameEditSheet

---

# 10. API 영향

## 조회

예상

```text
GET /me
```

또는

```text
GET /users/me
```

---

## 프로필 수정

예상

```text
PATCH /users/me/profile
```

---

## 닉네임 수정

예상

```text
PATCH /users/me
```

---

## 출발지 삭제

예상

```text
DELETE /departure/{id}
```

---

### 미확인

실제 API 명세 필요

---

# 11. 상태(State)

## Loading

- 사용자 정보 조회
- 출발지 조회

---

## Success

- 조회 완료

---

## Empty

### 미확인

출발지가 하나도 없는 상태

---

## Editing

- Profile Editing
- Nickname Editing

---

## Error

- 조회 실패
- 수정 실패
- 삭제 실패

---

# 12. Edge Case

- 출발지가 없음
- 출발지가 최대 개수인 경우
- 닉네임 최대 길이
- 공백 입력
- 특수문자 입력
- 동일한 닉네임
- 프로필 변경 없이 완료
- 출발지 삭제 실패
- 네트워크 오류

---

# 13. QA

### 계정

- 기본 정보 정상 표시

---

### 프로필

- Bottom Sheet 노출
- 선택 변경
- 취소
- 완료

---

### 닉네임

- 입력 Validation
- 완료 버튼 활성화
- 취소
- 완료

---

### 출발지

- 리스트 표시
- 삭제
- 추가 버튼 이동

---

### Navigation

- 뒤로가기
- HOME 이동

---

# 14. unresolved

### 1. 출발지 최대 개수

기획에는 저장 가능한 최대 개수가 명시되어 있지 않다.

→ **기획 확인 필요**

---

### 2. 프로필 이미지 저장 방식

기획에는 "기본 프로필 4종 선택"만 명시되어 있으며, 선택 즉시 저장인지 완료 버튼 이후 저장인지 서버 동작이 명확하지 않다.

→ **API/기획 확인 필요**

---

### 3. 닉네임 Validation

Wireframe에는 `2~10자` 안내 문구만 존재한다.

다음 사항은 명시되어 있지 않다.

- 영문 대소문자 허용 범위
- 숫자 허용 여부
- 특수문자 허용 여부
- 중복 검사 여부

→ **기획 확인 필요**

---

### 4. 저장된 출발지 Empty State

현재 기획과 Wireframe 모두 출발지가 하나도 없는 상태를 정의하지 않는다.

→ **Empty State 필요 여부 확인**
