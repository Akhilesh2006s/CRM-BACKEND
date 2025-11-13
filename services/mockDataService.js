// Mock data service for development when database is not available
class MockDataService {
  constructor() {
    this.data = {
      users: [
        {
          _id: '1',
          name: 'Pavan Simhadri',
          email: 'pavan@viswamedutech.com',
          role: 'Super Admin',
          phone: '+91-9876543210',
          department: 'Management',
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '2',
          name: 'John Doe',
          email: 'john@viswamedutech.com',
          role: 'Executive',
          phone: '+91-9876543211',
          department: 'Sales',
          isActive: true,
          lastLogin: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      leads: [
        {
          _id: '1',
          name: 'ABC School',
          email: 'contact@abcschool.com',
          phone: '+91-9876543212',
          zone: 'Nizamabad',
          status: 'Hot',
          source: 'Website',
          assignedTo: '1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          _id: '2',
          name: 'XYZ College',
          email: 'info@xyzcollege.com',
          phone: '+91-9876543213',
          zone: 'Hyderabad',
          status: 'Warm',
          source: 'Referral',
          assignedTo: '2',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      sales: [
        {
          _id: '1',
          leadId: '1',
          amount: 50000,
          status: 'Completed',
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      trainings: [
        {
          _id: '1',
          title: 'Digital Marketing Training',
          description: 'Complete digital marketing course',
          status: 'Pending',
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          participants: ['1', '2'],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      employees: [
        {
          _id: '1',
          name: 'Pavan Simhadri',
          email: 'pavan@viswamedutech.com',
          role: 'Super Admin',
          phone: '+91-9876543210',
          department: 'Management',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    };
  }

  // User methods
  async findUser(query) {
    if (query._id) {
      return this.data.users.find(user => user._id === query._id);
    }
    if (query.email) {
      return this.data.users.find(user => user.email === query.email);
    }
    if (query.firebaseUID) {
      return this.data.users.find(user => user.firebaseUID === query.firebaseUID);
    }
    return null;
  }

  async createUser(userData) {
    const newUser = {
      _id: (this.data.users.length + 1).toString(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.users.push(newUser);
    return newUser;
  }

  async updateUser(id, updateData) {
    const userIndex = this.data.users.findIndex(user => user._id === id);
    if (userIndex !== -1) {
      this.data.users[userIndex] = {
        ...this.data.users[userIndex],
        ...updateData,
        updatedAt: new Date()
      };
      return this.data.users[userIndex];
    }
    return null;
  }

  // Lead methods
  async getLeads() {
    return this.data.leads;
  }

  async getLead(id) {
    return this.data.leads.find(lead => lead._id === id);
  }

  async createLead(leadData) {
    const newLead = {
      _id: (this.data.leads.length + 1).toString(),
      ...leadData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.leads.push(newLead);
    return newLead;
  }

  async updateLead(id, updateData) {
    const leadIndex = this.data.leads.findIndex(lead => lead._id === id);
    if (leadIndex !== -1) {
      this.data.leads[leadIndex] = {
        ...this.data.leads[leadIndex],
        ...updateData,
        updatedAt: new Date()
      };
      return this.data.leads[leadIndex];
    }
    return null;
  }

  async deleteLead(id) {
    const leadIndex = this.data.leads.findIndex(lead => lead._id === id);
    if (leadIndex !== -1) {
      return this.data.leads.splice(leadIndex, 1)[0];
    }
    return null;
  }

  // Sales methods
  async getSales() {
    return this.data.sales;
  }

  async createSale(saleData) {
    const newSale = {
      _id: (this.data.sales.length + 1).toString(),
      ...saleData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.sales.push(newSale);
    return newSale;
  }

  // Training methods
  async getTrainings() {
    return this.data.trainings;
  }

  async createTraining(trainingData) {
    const newTraining = {
      _id: (this.data.trainings.length + 1).toString(),
      ...trainingData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.trainings.push(newTraining);
    return newTraining;
  }

  // Employee methods
  async getEmployees() {
    return this.data.employees;
  }

  async createEmployee(employeeData) {
    const newEmployee = {
      _id: (this.data.employees.length + 1).toString(),
      ...employeeData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.data.employees.push(newEmployee);
    return newEmployee;
  }

  // Dashboard statistics
  async getDashboardStats() {
    const activeLeads = this.data.leads.filter(lead => lead.status === 'Hot' || lead.status === 'Warm').length;
    const totalSales = this.data.sales.reduce((sum, sale) => sum + sale.amount, 0);
    const existingSchools = this.data.leads.length;
    const pendingTrainings = this.data.trainings.filter(training => training.status === 'Pending').length;
    const completedTrainings = this.data.trainings.filter(training => training.status === 'Completed').length;
    const pendingServices = 0; // Placeholder
    const completedServices = 0; // Placeholder

    return {
      activeLeads,
      totalSales,
      existingSchools,
      pendingTrainings,
      completedTrainings,
      pendingServices,
      completedServices
    };
  }

  // Zone-wise leads data
  async getLeadsByZone() {
    const zoneData = {};
    this.data.leads.forEach(lead => {
      if (!zoneData[lead.zone]) {
        zoneData[lead.zone] = {
          zone: lead.zone,
          totalLeads: 0,
          hot: 0,
          warm: 0,
          cold: 0
        };
      }
      zoneData[lead.zone].totalLeads++;
      zoneData[lead.zone][lead.status.toLowerCase()]++;
    });
    return Object.values(zoneData);
  }
}

module.exports = new MockDataService();


