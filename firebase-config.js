// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDDBwF-vBp6VNJ2lbT3DT3vabm8D1hYT20",
  authDomain: "employee-management-syst-4d5ec.firebaseapp.com",
  projectId: "employee-management-syst-4d5ec",
  storageBucket: "employee-management-syst-4d5ec.firebasestorage.app",
  messagingSenderId: "1001779947918",
  appId: "1:1001779947918:web:103c7557c8ab18b6739cdf",
  measurementId: "G-0MPSRXJ7YH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Storage Helper Functions
const FirebaseStorage = {
  
  // Get all data from Firebase
  async getData() {
    try {
      const docRef = doc(db, "system", "appData");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        const defaultData = {
          members: [],
          leaders: [],
          tasks: [],
          attendance: [],
          leaves: [],
          evaluations: [],
          notes: [],
          notifications: [],
          teams: [],
          salary: [],
          requests: [],
          currentUser: null,
          language: 'ar',
          darkMode: false,
          activityLog: []
        };
        await setDoc(docRef, defaultData);
        return defaultData;
      }
    } catch (error) {
      console.error("Error getting data:", error);
      return null;
    }
  },
  
  // Save all data to Firebase
  async saveData(data) {
    try {
      const docRef = doc(db, "system", "appData");
      await setDoc(docRef, data);
      console.log("✅ Data saved to Firebase");
      return true;
    } catch (error) {
      console.error("Error saving data:", error);
      return false;
    }
  },
  
  // Update specific field
  async updateField(field, value) {
    try {
      const docRef = doc(db, "system", "appData");
      await updateDoc(docRef, { [field]: value });
      return true;
    } catch (error) {
      console.error("Error updating field:", error);
      return false;
    }
  },
  
  // Add member
  async addMember(member) {
    try {
      const data = await this.getData();
      data.members.push(member);
      await this.saveData(data);
      return true;
    } catch (error) {
      console.error("Error adding member:", error);
      return false;
    }
  },
  
  // Update member
  async updateMember(memberId, updates) {
    try {
      const data = await this.getData();
      const index = data.members.findIndex(m => m.id === memberId);
      if (index !== -1) {
        data.members[index] = { ...data.members[index], ...updates };
        await this.saveData(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating member:", error);
      return false;
    }
  },
  
  // Set current user
  async setCurrentUser(user) {
    try {
      await this.updateField('currentUser', user);
      return true;
    } catch (error) {
      console.error("Error setting current user:", error);
      return false;
    }
  },
  
  // Clear current user (logout)
  async clearCurrentUser() {
    try {
      await this.updateField('currentUser', null);
      return true;
    } catch (error) {
      console.error("Error clearing current user:", error);
      return false;
    }
  }
};

// Export for use in other files
export { FirebaseStorage, db };