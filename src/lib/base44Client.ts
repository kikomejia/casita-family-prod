"use client";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';

class EntityCollection {
  name: string;
  constructor(name: string) {
    this.name = name;
  }

  private getCollectionRef() {
    return collection(db, this.name);
  }

  async list(sortField?: string, limitCount?: number): Promise<any[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      let q = query(this.getCollectionRef(), where("uid", "==", userId));
      
      if (sortField) {
        const desc = sortField.startsWith('-');
        const field = desc ? sortField.substring(1) : sortField;
        q = query(q, orderBy(field, desc ? 'desc' : 'asc'));
      }
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.name);
      return [];
    }
  }

  async filter(queryObj: Record<string, any>, sortField?: string, limitCount?: number): Promise<any[]> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return [];

      let q = query(this.getCollectionRef(), where("uid", "==", userId));
      
      Object.entries(queryObj).forEach(([key, value]) => {
        q = query(q, where(key, "==", value));
      });

      if (sortField) {
        const desc = sortField.startsWith('-');
        const field = desc ? sortField.substring(1) : sortField;
        q = query(q, orderBy(field, desc ? 'desc' : 'asc'));
      }
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, this.name);
      return [];
    }
  }

  async create(data: any) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const docData = {
        ...data,
        uid: userId,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      
      const docRef = await addDoc(this.getCollectionRef(), docData);
      return { id: docRef.id, ...docData };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, this.name);
    }
  }

  async update(id: string, data: any) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const docRef = doc(db, this.name, id);
      const updateData = {
        ...data,
        uid: userId, // Ensure uid is present
        updated_date: new Date().toISOString()
      };
      await updateDoc(docRef, updateData);
      return { id, ...updateData };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.name}/${id}`);
    }
  }

  async delete(id: string) {
    try {
      const docRef = doc(db, this.name, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${this.name}/${id}`);
    }
  }

  async deleteMany(ids: string[]) {
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        batch.delete(doc(db, this.name, id));
      });
      await batch.commit();
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${this.name}/multiple`);
    }
  }

  async createMany(dataList: any[]) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("User not authenticated");

      const batch = writeBatch(db);
      const results: any[] = [];
      
      dataList.forEach(data => {
        const docRef = doc(this.getCollectionRef());
        const docData = {
          ...data,
          uid: userId,
          created_date: new Date().toISOString(),
          updated_date: new Date().toISOString(),
        };
        batch.set(docRef, docData);
        results.push({ id: docRef.id, ...docData });
      });
      
      await batch.commit();
      return results;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${this.name}/multiple`);
    }
  }

  subscribe(callback: (data: any[]) => void, sortField?: string, limitCount?: number) {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      callback([]);
      return () => {};
    }

    let q = query(this.getCollectionRef(), where("uid", "==", userId));
    
    if (sortField) {
      const desc = sortField.startsWith('-');
      const field = desc ? sortField.substring(1) : sortField;
      q = query(q, orderBy(field, desc ? 'desc' : 'asc'));
    }
    
    if (limitCount) {
      q = query(q, limit(limitCount));
    }

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.name);
    });
  }

  subscribeOne(id: string, callback: (data: any) => void) {
    const docRef = doc(db, this.name, id);
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${this.name}/${id}`);
    });
  }
}

export const base44 = {
  entities: {
    FamilyMember: new EntityCollection('members'),
    CalendarEvent: new EntityCollection('events'),
    FamilyGoal: new EntityCollection('goals'),
    Chore: new EntityCollection('chores'),
    RewardLog: new EntityCollection('rewards'),
    Settings: new EntityCollection('settings'),
  },
  auth: {
    me: async () => ({ id: auth.currentUser?.uid, email: auth.currentUser?.email, full_name: auth.currentUser?.displayName, role: 'admin' })
  }
};

export const seedData = async (userId: string) => {
  try {
    const members = base44.entities.FamilyMember;
    const existingMembers = await members.list();
    
    // 1. Cleanup duplicates if they exist
    const seenNames = new Set();
    const duplicateIds = [];
    for (const m of existingMembers) {
      if (seenNames.has(m.name)) {
        duplicateIds.push(m.id);
      } else {
        seenNames.add(m.name);
      }
    }
    
    if (duplicateIds.length > 0) {
      console.log(`Cleaning up ${duplicateIds.length} duplicate members...`);
      await members.deleteMany(duplicateIds);
    }

    // 2. Seed if no members remain
    const remainingMembers = await members.list();
    if (remainingMembers.length === 0) {
      console.log("Seeding initial members...");
      await members.createMany([
        { name: 'Francisco', role: 'parent', points: 0, lifetime_points: 0, color: '#06b6d4' },
        { name: 'Gabriela', role: 'parent', points: 0, lifetime_points: 0, color: '#d946ef' },
        { name: 'Maya', role: 'child', points: 5, lifetime_points: 5, color: '#22c55e' },
        { name: 'Luna', role: 'child', points: 8, lifetime_points: 8, color: '#8b5cf6' }
      ]);
    }

    const goals = base44.entities.FamilyGoal;
    const existingGoals = await goals.list();
    if (existingGoals.length === 0) {
      console.log("Seeding initial goal...");
      await goals.create({ title: 'Family Movie Night', target_points: 50, current_points: 13, is_active: true, reward: 'Pizza and a movie of choice!' });
    }

    // 3. Ensure settings exist
    const settingsRef = doc(db, 'settings', 'family');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        uid: userId,
        chores: ["Make Bed", "Brush Teeth", "Clean Room", "Read 20 mins", "Help with Dinner"],
        prizes: ["Extra Screen Time", "Ice Cream", "Choose Movie", "Stay Up Late", "New Toy", "Pizza Night", "Skip a Chore", "Small Treat"],
        event_types: ["Karate", "Playdate", "Doctor", "School Event", "Family Outing", "Other"],
        pin: "1234",
        is_seeded: true,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString()
      });
    } else if (!settingsSnap.data().is_seeded) {
      await setDoc(settingsRef, { is_seeded: true }, { merge: true });
    }

    console.log("Data sync and cleanup complete.");
  } catch (error) {
    console.error("Error during data sync/cleanup:", error);
  }
};
