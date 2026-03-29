# API Response Format Fixes - DiaryPage, AIChatPage, AppointmentsPage

## Đã Fix

### 1. **DiaryPage.jsx** ✅
**Problem**: `entries.map is not a function` - Backend trả về `{ success: true, diaries: rows }` nhưng frontend expect array trực tiếp

**Fix**:
```javascript
// Trước:
setEntries(res.data || [])

// Sau:
setEntries(res.data.diaries || [])
```

---

### 2. **AppointmentsPage.jsx** ✅
**Problems**:
- Thiếu counselor list fetching
- Dialog form fields không match backend (counselorId → counselor_id, date → appointment_date, time → appointment_time, title → note)

**Fixes**:
a) Added counselor list loading:
```javascript
const loadCounselors = async () => {
  try {
    const res = await appointmentService.getCounselors();
    setCounselors(res.data.counselors || []);
  } catch (err) {
    console.error('Load counselors error:', err);
  }
};
```

b) Updated form handling to use `counselor_id`, `appointment_date`, `appointment_time`, `note` fields

c) Replaced TextField với Select dropdown để cho phép chọn counselor từ danh sách:
```javascript
<FormControl fullWidth margin="normal">
  <InputLabel>Tư vấn viên</InputLabel>
  <Select
    value={formData.counselor_id}
    onChange={(e) => setFormData((prev) => ({ ...prev, counselor_id: e.target.value }))}
    label="Tư vấn viên"
  >
    {counselors.map((counselor) => (
      <MenuItem key={counselor._id || counselor.id} value={counselor._id || counselor.id}>
        {counselor.full_name || counselor.name}
      </MenuItem>
    ))}
  </Select>
</FormControl>
```

---

### 3. **ChatBox.jsx** ✅
**Problem**: Backend expects `content` field nhưng frontend gửi `message`

**Fix**:
```javascript
// Trước:
await messageService.sendMessage({
  appointment_id: appointmentId,
  message: input,
})

// Sau:
await messageService.sendMessage({
  appointment_id: appointmentId,
  content: input,
})
```

---

### 4. **CommunityPage.jsx** ✅
**Fix**: Response extraction cho `posts` field (như DiaryPage)
```javascript
// Trước:
setPosts(res.data || [])

// Sau:
setPosts(res.data.posts || [])
```

---

## Backend Response Formats (Confirmed)

| Endpoint | Method | Response Format |
|----------|--------|-----------------|
| `/diary` | GET | `{ success: true, diaries: [...] }` |
| `/ai-chat` | POST | `{ success: true, reply: "..." }` |
| `/counselors` | GET | `{ success: true, counselors: [...] }` |
| `/appointments` | GET | `{ success: true, appointments: [...] }` |
| `/messages/:id` | GET | `{ success: true, messages: [...] }` |
| `/messages` | POST | Expects: `{ appointment_id, content }` |
| `/posts` | GET | `{ success: true, posts: [...] }` |

---

## Compilation Status

✅ **Build Successful** - All TypeScript/JSX syntax correct
✅ **Frontend Running** - React dev server on port 3001
✅ **All components compiling** without errors

---

## Next Testing Steps

1. **Reload frontend** in browser (http://localhost:3001)
2. **Test Diary page**:
   - Click "Nhật ký" sidebar
   - Should load diary entries without errors
   - Try creating new entry

3. **Test Appointments page**:
   - Click "Lịch hẹn" sidebar
   - Should display counselor list in dropdown
   - Try booking new appointment
   - Test messaging with counselor

4. **Test AI Chat**:
   - Click "Tư vấn AI" sidebar
   - Send message to AI
   - Verify response appears

5. **Test Community**:
   - Click "Cộng động" sidebar
   - Should load posts without errors

---

## Notes

- Backend MySQL database bắt buộc phải có counselor data
- Nếu Appointments vẫn empty, kiểm tra database seed data
- Verify backend `GOOGLE_API_KEY` environment variable cho AI Chat
