const URLS = {
  auth: 'https://functions.poehali.dev/395fed53-bace-4508-9960-3fa956a301a6',
  schedule: 'https://functions.poehali.dev/d2ad2bc4-e1af-4982-a19d-c3409e1a05eb',
  absences: 'https://functions.poehali.dev/dfcbe19a-36f6-4fca-9c4e-45f24f996e5a',
  users: 'https://functions.poehali.dev/806b258d-a2ba-47c3-8994-f1f4d327b35a',
  notifications: 'https://functions.poehali.dev/0934094f-f21e-4312-ac5a-009e1b0b1040',
};

async function req(url: string, options?: RequestInit) {
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка запроса');
  return data;
}

export const api = {
  auth: {
    status: () => req(`${URLS.auth}?action=status`),
    login: (username: string, password: string, role?: string) =>
      req(URLS.auth, { method: 'POST', body: JSON.stringify({ username, password, role }) }),
    registerAdmin: (username: string, password: string, display_name: string) =>
      req(`${URLS.auth}?action=register-admin`, { method: 'POST', body: JSON.stringify({ username, password, display_name }) }),
  },
  schedule: {
    getAll: () => req(URLS.schedule),
    update: (data: object) => req(URLS.schedule, { method: 'PUT', body: JSON.stringify(data) }),
  },
  absences: {
    getAll: (student_id?: number) => req(student_id ? `${URLS.absences}?student_id=${student_id}` : URLS.absences),
    create: (data: object) => req(URLS.absences, { method: 'POST', body: JSON.stringify(data) }),
    update: (data: object) => req(URLS.absences, { method: 'PUT', body: JSON.stringify(data) }),
  },
  users: {
    getAll: (role?: string) => req(role ? `${URLS.users}?role=${role}` : URLS.users),
    create: (data: object) => req(URLS.users, { method: 'POST', body: JSON.stringify(data) }),
    update: (data: object) => req(URLS.users, { method: 'PUT', body: JSON.stringify(data) }),
    uploadAvatar: (user_id: number, file_data: string, content_type: string) =>
      req(`${URLS.users}/upload-avatar`, { method: 'POST', body: JSON.stringify({ user_id, file_data, content_type }) }),
  },
  notifications: {
    get: (user_id: number) => req(`${URLS.notifications}?user_id=${user_id}`),
    markRead: (user_id: number) => req(URLS.notifications, { method: 'PUT', body: JSON.stringify({ user_id }) }),
  },
};
