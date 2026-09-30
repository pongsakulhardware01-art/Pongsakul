# Security Specification & Threat Modeling

## Data Invariants
1. **Employees Collection**:
   - Every Employee document must contain an `id` matching its Firestore document ID.
   - Required fields (`id`, `employeeCode`, `firstName`, `lastName`, `position`, `department`, `isActive`) must always be defined with their respective types and string bounds.
   - Any unknown/unapproved field in the payload must be rejected.

2. **Holidays Collection**:
   - Every HolidayLeave document must contain an `id` matching its Firestore document ID.
   - Must contain a valid `employeeId` reference.
   - The leave type must be exactly one of: `vacation`, `sick`, `personal`, `public_holiday`, `other`.

3. **Settings Collection**:
   - The only acceptable document is `global`.
   - Must contain a string `companyName` and `weekendType`.

---

## The "Dirty Dozen" Threat Payloads (Targeting Permissive Edits)

### 1. Employee Ghost Field (Vandalism)
```json
{
  "id": "emp-101",
  "employeeCode": "EMP101",
  "firstName": "John",
  "lastName": "Doe",
  "position": "Manager",
  "department": "IT",
  "isActive": true,
  "isOwner": true
}
```
*Expected Result*: `PERMISSION_DENIED` (Keys length exceeds 7 required fields, contains illegal ghost field `isOwner`).

### 2. Sized-Exceeded String (Wallet Exhaustion Attack)
```json
{
  "id": "emp-101",
  "employeeCode": "EMP101",
  "firstName": "Johnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn",
  "lastName": "Doe",
  "position": "Manager",
  "department": "IT",
  "isActive": true
}
```
*Expected Result*: `PERMISSION_DENIED` (First name size exceeds 100 characters constraint).

### 3. Sibling Path Mismatch (Spoofing)
```json
{
  "id": "emp-different-id",
  "employeeCode": "EMP101",
  "firstName": "John",
  "lastName": "Doe",
  "position": "Manager",
  "department": "IT",
  "isActive": true
}
```
*Expected Result*: `PERMISSION_DENIED` (Document ID `emp-101` does not match the internal payload `id` field).

### 4. Malformed Path Injection (Injection Attack)
Trying to write to path: `/employees/emp-101/malicious/subpath`
*Expected Result*: `PERMISSION_DENIED` (Route does not exist and is blocked by default safety net).

### 5. Type Poisoning: Number as Name
```json
{
  "id": "emp-101",
  "employeeCode": "EMP101",
  "firstName": 12345,
  "lastName": "Doe",
  "position": "Manager",
  "department": "IT",
  "isActive": true
}
```
*Expected Result*: `PERMISSION_DENIED` (`firstName` is not a string).

### 6. Non-Existent Leave Type (State Bypass)
```json
{
  "id": "hol-101",
  "employeeId": "emp-101",
  "startDate": "2026-06-20",
  "endDate": "2026-06-22",
  "type": "unlimited-paid-vacay",
  "title": "Extended Holiday",
  "durationDays": 3
}
```
*Expected Result*: `PERMISSION_DENIED` (`type` value is not within the validated enum options).

### 7. Negative Duration Days (Logic Hack)
```json
{
  "id": "hol-101",
  "employeeId": "emp-101",
  "startDate": "2026-06-20",
  "endDate": "2026-06-22",
  "type": "sick",
  "title": "Extended Holiday",
  "durationDays": -100
}
```
*Expected Result*: `PERMISSION_DENIED` (Negative duration checks can be added to standard duration bounds).

### 8. Holiday Ghost Field Injection
```json
{
  "id": "hol-101",
  "employeeId": "emp-101",
  "startDate": "2026-06-20",
  "endDate": "2026-06-22",
  "type": "sick",
  "title": "Flu",
  "durationDays": 3,
  "approved": true
}
```
*Expected Result*: `PERMISSION_DENIED` (Extra ghost field `approved` is not part of the allowed schema keys size).

### 9. Settings ID Hijack
Writing a settings document with ID `custom-setting`:
```json
{
  "companyName": "Fake Corp",
  "weekendType": "sat-sun"
}
```
*Expected Result*: `PERMISSION_DENIED` (The document path variable must be exactly `'global'`).

### 10. Settings Value Type Poisoning
```json
{
  "companyName": "Fake Corp",
  "weekendType": 9999
}
```
*Expected Result*: `PERMISSION_DENIED` (`weekendType` is not a string).

### 11. Malicious Wildcard Injection
Trying to write a nested document within `/settings/global/secrets/leak`
*Expected Result*: `PERMISSION_DENIED` (Blocked by default-deny wildcard catch-all).

### 12. Employee Code Type Poisoning
```json
{
  "id": "emp-101",
  "employeeCode": true,
  "firstName": "John",
  "lastName": "Doe",
  "position": "Manager",
  "department": "IT",
  "isActive": true
}
```
*Expected Result*: `PERMISSION_DENIED` (`employeeCode` is not a string).
