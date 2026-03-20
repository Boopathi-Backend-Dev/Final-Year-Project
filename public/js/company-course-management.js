/* Company Course Management System */

const CompanyCourseAPI = {
  // Courses
  async getCourses() {
    return API.get('/api/company/courses');
  },

  async createCourse(data) {
    return API.post('/api/company/courses', data);
  },

  // Modules
  async getCourseModules(courseId) {
    return API.get(`/api/progress/courses/${courseId}/modules`);
  },

  async addModule(courseId, data) {
    return API