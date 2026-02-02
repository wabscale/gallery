import { authAPI } from './api';

class AuthService {
  async login(username, password) {
    const response = await authAPI.login(username, password);
    return response.data;
  }

  async logout() {
    await authAPI.logout();
  }

  async getCurrentUser() {
    const response = await authAPI.me();
    return response.data;
  }
}

export default new AuthService();
