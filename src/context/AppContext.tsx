import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  limit,
  Timestamp 
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { db, auth, isFirebaseActive } from '../firebase';
import { UserProfile, StudyRoom, Message, StudyLog, Task } from '../types';

// Firestore Error handler schema matching Firebase integration skills
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error Captured: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AppContextType {
  user: UserProfile | null;
  isCloudReady: boolean;
  isLoading: boolean;
  rooms: StudyRoom[];
  activeRoom: StudyRoom | null;
  chatMessages: Message[];
  tasks: Task[];
  studyLogs: StudyLog[];
  
  // Auth Operations
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: (name: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Room Operations
  createRoom: (name: string, description: string) => Promise<string>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => Promise<void>;
  updateRoomTimer: (roomId: string, updates: Partial<StudyRoom>) => Promise<void>;
  
  // Chat Operations
  sendMessage: (text: string) => Promise<void>;
  
  // Task Operations
  addTask: (title: string, subject: string) => Promise<void>;
  toggleTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // Study Metrics
  saveStudyLog: (subject: string, durationSeconds: number, taskTitle?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PRESET_ROOMS: StudyRoom[] = [
  {
    id: "silent-hall",
    name: "Silent Focus Hall",
    description: "Deep, quiet individual work. Best for examinations or writing complex research.",
    creatorId: "system",
    createdAt: new Date().toISOString(),
    activeCount: 3,
    timerDuration: 1500,
    timerStatus: "idle",
    timerEndsAt: null,
    timerType: "pomodoro"
  },
  {
    id: "synthwave",
    name: "Lofi & Cyber Beats Lounge",
    description: "Relaxed background vibes to keep your coding session or homework flowing in harmony.",
    creatorId: "system",
    createdAt: new Date().toISOString(),
    activeCount: 5,
    timerDuration: 1500,
    timerStatus: "idle",
    timerEndsAt: null,
    timerType: "pomodoro"
  },
  {
    id: "pomodoro-room",
    name: "Pomodoro Elite Arena",
    description: "Strict 25/5 focus intervals. Study with dynamic peers and synchronised intervals.",
    creatorId: "system",
    createdAt: new Date().toISOString(),
    activeCount: 8,
    timerDuration: 1500,
    timerStatus: "idle",
    timerEndsAt: null,
    timerType: "pomodoro"
  }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [rooms, setRooms] = useState<StudyRoom[]>(PRESET_ROOMS);
  const [activeRoom, setActiveRoom] = useState<StudyRoom | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [isCloudReady, setIsCloudReady] = useState(isFirebaseActive);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback storage handlers for local usage
  const loadLocalData = (storedUser: UserProfile) => {
    // Tasks
    const localTasks = localStorage.getItem(`tasks_${storedUser.userId}`);
    if (localTasks) setTasks(JSON.parse(localTasks));
    else setTasks([]);

    // Study Logs
    const localLogs = localStorage.getItem(`logs_${storedUser.userId}`);
    if (localLogs) setStudyLogs(JSON.parse(localLogs));
    else setStudyLogs([]);

    // Custom Rooms
    const localRooms = localStorage.getItem("custom_rooms");
    if (localRooms) {
      const parsedCustom = JSON.parse(localRooms);
      setRooms([...PRESET_ROOMS, ...parsedCustom]);
    } else {
      setRooms(PRESET_ROOMS);
    }
  };

  // Check state transitions for Local Storage fallback when offline or no firebase config
  useEffect(() => {
    if (isCloudReady && auth) {
      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        setIsLoading(true);
        if (firebaseUser) {
          const userProfile: UserProfile = {
            userId: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Scholar Guest",
            email: firebaseUser.email || "guest@costudy.local",
            totalStudyTime: 0,
            totalSessions: 0,
            updatedAt: new Date().toISOString(),
            photoUrl: firebaseUser.photoURL || undefined
          };

          // Try downloading user document to sync total study time
          try {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              const data = userDocSnap.data();
              userProfile.totalStudyTime = data.totalStudyTime || 0;
              userProfile.totalSessions = data.totalSessions || 0;
              userProfile.displayName = data.displayName || userProfile.displayName;
            } else {
              // Create default document
              await setDoc(userDocRef, {
                userId: userProfile.userId,
                displayName: userProfile.displayName,
                email: userProfile.email,
                totalStudyTime: 0,
                totalSessions: 0,
                updatedAt: Timestamp.now()
              });
            }
          } catch (e) {
            console.warn("Could not retrieve online user stats, fallback used.", e);
          }

          setUser(userProfile);
          setIsLoading(false);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      });

      return () => unsubscribeAuth();
    } else {
      // Offline/Local Storage Auth Simulation
      const currentStored = localStorage.getItem("local_user");
      if (currentStored) {
        const parsed = JSON.parse(currentStored);
        setUser(parsed);
        loadLocalData(parsed);
      }
      setIsLoading(false);
    }
  }, [isCloudReady]);

  // Firebase Realtime Subscriptions for tasks, logs, rooms
  useEffect(() => {
    if (!user || !isCloudReady || !db) return;

    // --- Rooms Sync ---
    const qRooms = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
    const unsubRooms = onSnapshot(qRooms, (snap) => {
      const cloudRooms: StudyRoom[] = [];
      snap.forEach((docSnap) => {
        cloudRooms.push(docSnap.data() as StudyRoom);
      });
      // Merge with system preset rooms
      const filteredPresets = PRESET_ROOMS.filter(p => !cloudRooms.some(c => c.id === p.id));
      setRooms([...filteredPresets, ...cloudRooms]);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'rooms');
    });

    // --- Tasks Sync ---
    const qTasks = query(collection(db, 'tasks'), where('userId', '==', user.userId), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(qTasks, (snap) => {
      const fetchedTasks: Task[] = [];
      snap.forEach((d) => {
        fetchedTasks.push(d.data() as Task);
      });
      setTasks(fetchedTasks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    // --- Study Logs Sync ---
    const qLogs = query(collection(db, 'studyLogs'), where('userId', '==', user.userId), orderBy('createdAt', 'desc'));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      const fetchedLogs: StudyLog[] = [];
      snap.forEach((d) => {
        fetchedLogs.push(d.data() as StudyLog);
      });
      setStudyLogs(fetchedLogs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'studyLogs');
    });

    return () => {
      unsubRooms();
      unsubTasks();
      unsubLogs();
    };
  }, [user, isCloudReady]);

  // Real-time Messages Listener for Active Room
  useEffect(() => {
    if (!activeRoom || !isCloudReady || !db) return;

    const pathForMsg = `rooms/${activeRoom.id}/messages`;
    const qMessages = query(
      collection(db, pathForMsg),
      orderBy('createdAt', 'asc'),
      limit(60)
    );

    const unsubMessages = onSnapshot(qMessages, (snap) => {
      const msgs: Message[] = [];
      snap.forEach((d) => {
        msgs.push(d.data() as Message);
      });
      setChatMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, pathForMsg);
    });

    return () => unsubMessages();
  }, [activeRoom, isCloudReady]);

  // Active Timer Listener
  useEffect(() => {
    if (!activeRoom) return;

    if (isCloudReady && db) {
      const roomDocRef = doc(db, 'rooms', activeRoom.id);
      const unsubRoomDetail = onSnapshot(roomDocRef, (snap) => {
        if (snap.exists()) {
          setActiveRoom(snap.data() as StudyRoom);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `rooms/${activeRoom.id}`);
      });
      return () => unsubRoomDetail();
    }
  }, [isCloudReady, activeRoom?.id]);

  // Simulated multiplayer messages when in local storage mode
  useEffect(() => {
    if (!activeRoom || isCloudReady) return;

    // Reset messages for active local room
    const key = `chat_${activeRoom.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setChatMessages(JSON.parse(stored));
    } else {
      // Populate placeholder initial messages
      const initials: Message[] = [
        {
          id: "init1",
          roomId: activeRoom.id,
          senderId: "system_buddy",
          senderName: "StudyBot Pro",
          text: `Welcome to ${activeRoom.name}! Set up your Pomodoro duration to begin stretching your mind.`,
          createdAt: new Date(Date.now() - 50000).toISOString()
        }
      ];
      setChatMessages(initials);
      localStorage.setItem(key, JSON.stringify(initials));
    }

    // Interval to spawn simulated friendly peer interactions to make it feel super alive!
    const names = ["Aria", "Kai", "Siddharth", "Zoe", "Hiroshi", "Elena"];
    const greetings = [
      "Hey everyone, just joined! Let's get this session done.",
      "Today focus goal: study 3 hours of linear algebra. What are you all working on?",
      "Finished a full Pomodoro working block. Feels great! Time for some green tea.",
      "Stuck on this physics equation... but going to power through!",
      "Keep pushing your limits! Your future self will thank you.",
      "Taking a 5 min breather, highly recommend stretching your legs."
    ];

    const messageInterval = setInterval(() => {
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomText = greetings[Math.floor(Math.random() * greetings.length)];
      const newMsg: Message = {
        id: `sim_${Date.now()}`,
        roomId: activeRoom.id,
        senderId: `sim_user_${randomName.toLowerCase()}`,
        senderName: randomName,
        text: randomText,
        createdAt: new Date().toISOString()
      };

      setChatMessages((prev) => {
        const next = [...prev, newMsg].slice(-80);
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    }, 45000); // Send a friendly check-in every 45s

    return () => clearInterval(messageInterval);
  }, [activeRoom?.id, isCloudReady]);

  // --- ACTIONS ---

  const loginWithGoogle = async () => {
    if (isCloudReady && auth) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      } catch (err) {
        console.error("Google Authenticator Login failed:", err);
        alert("Credential verification aborted or network failure.");
      }
    } else {
      alert("Local environment setup: Please log in using Guest Mode, or configure Firebase to deploy.");
    }
  };

  const loginAsGuest = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (isCloudReady && auth) {
      try {
        const cred = await signInAnonymously(auth);
        const guestProfile: UserProfile = {
          userId: cred.user.uid,
          displayName: trimmed,
          email: "anonymous-guest@costudy.local",
          totalStudyTime: 0,
          totalSessions: 0,
          updatedAt: new Date().toISOString()
        };
        // Save to firestore
        await setDoc(doc(db, 'users', cred.user.uid), {
          userId: guestProfile.userId,
          displayName: guestProfile.displayName,
          email: guestProfile.email,
          totalStudyTime: 0,
          totalSessions: 0,
          updatedAt: Timestamp.now()
        });
        setUser(guestProfile);
      } catch (e) {
        console.error("Guest authentication failed:", e);
      }
    } else {
      // Local authentication state simulation
      const mockProfile: UserProfile = {
        userId: `local_${Date.now()}`,
        displayName: trimmed,
        email: "anonymous-guest@costudy.local",
        totalStudyTime: 0,
        totalSessions: 0,
        updatedAt: new Date().toISOString()
      };
      setUser(mockProfile);
      localStorage.setItem("local_user", JSON.stringify(mockProfile));
      loadLocalData(mockProfile);
    }
  };

  const logout = async () => {
    if (isCloudReady && auth) {
      await signOut(auth);
    } else {
      localStorage.removeItem("local_user");
      setUser(null);
      setTasks([]);
      setStudyLogs([]);
      setActiveRoom(null);
    }
  };

  const createRoom = async (name: string, description: string): Promise<string> => {
    if (!user) throw new Error("Unauthenticated request");
    const roomId = `room_${Date.now()}`;
    const newRoom: StudyRoom = {
      id: roomId,
      name: name.trim(),
      description: description.trim() || "No description provided.",
      creatorId: user.userId,
      createdAt: new Date().toISOString(),
      activeCount: 1,
      timerDuration: 1500,
      timerStatus: "idle",
      timerEndsAt: null,
      timerType: "pomodoro"
    };

    if (isCloudReady && db) {
      try {
        await setDoc(doc(db, 'rooms', roomId), newRoom);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `rooms/${roomId}`);
      }
    } else {
      const currentCustom = localStorage.getItem("custom_rooms");
      const list = currentCustom ? JSON.parse(currentCustom) : [];
      const updated = [newRoom, ...list];
      localStorage.setItem("custom_rooms", JSON.stringify(updated));
      setRooms([...PRESET_ROOMS, ...updated]);
    }

    return roomId;
  };

  const joinRoom = async (roomId: string) => {
    const target = rooms.find(r => r.id === roomId);
    if (!target) return;

    // Track active user count increments
    if (isCloudReady && db) {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, {
          activeCount: target.activeCount + 1
        });
      } catch (error) {
        console.warn("Could not increment room occupant telemetry on Cloud.", error);
      }
    } else {
      // Update local rooms occupants state
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, activeCount: r.activeCount + 1 } : r));
    }

    setActiveRoom({ ...target, activeCount: target.activeCount + 1 });
  };

  const leaveRoom = async () => {
    if (!activeRoom) return;

    if (isCloudReady && db) {
      try {
        const roomRef = doc(db, 'rooms', activeRoom.id);
        const currentSnap = await getDoc(roomRef);
        if (currentSnap.exists()) {
          const currentCount = currentSnap.data().activeCount || 1;
          await updateDoc(roomRef, {
            activeCount: Math.max(0, currentCount - 1)
          });
        }
      } catch (error) {
        console.warn("Could not decrease room occupant telemetry on Cloud.", error);
      }
    } else {
      setRooms(prev => prev.map(r => r.id === activeRoom.id ? { ...r, activeCount: Math.max(0, r.activeCount - 1) } : r));
    }
    setActiveRoom(null);
    setChatMessages([]);
  };

  const updateRoomTimer = async (roomId: string, updates: Partial<StudyRoom>) => {
    if (isCloudReady && db) {
      try {
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, updates);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `rooms/${roomId}`);
      }
    } else {
      // Offline local store update
      setRooms(prev => prev.map(r => r.id === roomId ? { ...r, ...updates } : r));
      if (activeRoom && activeRoom.id === roomId) {
        setActiveRoom(prev => prev ? { ...prev, ...updates } : null);
      }
    }
  };

  const sendMessage = async (text: string) => {
    if (!user || !activeRoom) return;
    const msgId = `msg_${Date.now()}`;
    const newMsg: Message = {
      id: msgId,
      roomId: activeRoom.id,
      senderId: user.userId,
      senderName: user.displayName,
      text: text.trim(),
      createdAt: new Date().toISOString()
    };

    if (isCloudReady && db) {
      try {
        const path = `rooms/${activeRoom.id}/messages`;
        await setDoc(doc(db, path, msgId), newMsg);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `rooms/${activeRoom.id}/messages/${msgId}`);
      }
    } else {
      const key = `chat_${activeRoom.id}`;
      setChatMessages((prev) => {
        const next = [...prev, newMsg];
        localStorage.setItem(key, JSON.stringify(next));
        return next;
      });
    }
  };

  const addTask = async (title: string, subject: string) => {
    if (!user) return;
    const taskId = `task_${Date.now()}`;
    const newTask: Task = {
      id: taskId,
      userId: user.userId,
      title: title.trim(),
      subject: subject.trim(),
      completed: false,
      createdAt: new Date().toISOString()
    };

    if (isCloudReady && db) {
      try {
        await setDoc(doc(db, 'tasks', taskId), newTask);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `tasks/${taskId}`);
      }
    } else {
      setTasks((prev) => {
        const next = [newTask, ...prev];
        localStorage.setItem(`tasks_${user.userId}`, JSON.stringify(next));
        return next;
      });
    }
  };

  const toggleTask = async (taskId: string) => {
    if (!user) return;
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const updatedState = !target.completed;

    if (isCloudReady && db) {
      try {
        await updateDoc(doc(db, 'tasks', taskId), {
          completed: updatedState
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `tasks/${taskId}`);
      }
    } else {
      setTasks((prev) => {
        const next = prev.map(t => t.id === taskId ? { ...t, completed: updatedState } : t);
        localStorage.setItem(`tasks_${user.userId}`, JSON.stringify(next));
        return next;
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    if (isCloudReady && db) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `tasks/${taskId}`);
      }
    } else {
      setTasks((prev) => {
        const next = prev.filter(t => t.id !== taskId);
        localStorage.setItem(`tasks_${user.userId}`, JSON.stringify(next));
        return next;
      });
    }
  };

  const saveStudyLog = async (subject: string, durationSeconds: number, taskTitle?: string) => {
    if (!user) return;
    const logId = `log_${Date.now()}`;
    const newLog: StudyLog = {
      id: logId,
      userId: user.userId,
      subject: subject || "General Study",
      duration: durationSeconds,
      taskTitle: taskTitle || undefined,
      createdAt: new Date().toISOString()
    };

    // Increment local/online stats
    const updatedTotalTime = user.totalStudyTime + durationSeconds;
    const updatedSessions = user.totalSessions + 1;
    const updatedUserObj = {
      ...user,
      totalStudyTime: updatedTotalTime,
      totalSessions: updatedSessions,
      updatedAt: new Date().toISOString()
    };
    setUser(updatedUserObj);

    if (isCloudReady && db) {
      try {
        // Log write
        await setDoc(doc(db, 'studyLogs', logId), newLog);
        
        // Update User statistics
        await updateDoc(doc(db, 'users', user.userId), {
          totalStudyTime: updatedTotalTime,
          totalSessions: updatedSessions,
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `studyLogs/${logId}`);
      }
    } else {
      // Local
      localStorage.setItem("local_user", JSON.stringify(updatedUserObj));
      setStudyLogs((prev) => {
        const next = [newLog, ...prev];
        localStorage.setItem(`logs_${user.userId}`, JSON.stringify(next));
        return next;
      });
    }
  };

  return (
    <AppContext.Provider value={{
      user,
      isCloudReady,
      isLoading,
      rooms,
      activeRoom,
      chatMessages,
      tasks,
      studyLogs,
      loginWithGoogle,
      loginAsGuest,
      logout,
      createRoom,
      joinRoom,
      leaveRoom,
      updateRoomTimer,
      sendMessage,
      addTask,
      toggleTask,
      deleteTask,
      saveStudyLog
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
