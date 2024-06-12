import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBF9HUhaf400h81Um4aU3QqBTFZhVtsb1s",
    authDomain: "mytodo-92385.firebaseapp.com",
    projectId: "mytodo-92385",
    storageBucket: "mytodo-92385.appspot.com",
    messagingSenderId: "602485020424",
    appId: "1:602485020424:web:e1883eab4c05e82ebd3ebd",
    measurementId: "G-KEB0NCXMSG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Set SameSite=None and Secure for authentication cookies
const browserSessionPersistence = browserSessionPersistenceFromUrl();
auth.setPersistence(browserSessionPersistence);

// Function to set browser session persistence with appropriate SameSite settings
function browserSessionPersistenceFromUrl() {
  const url = window.location.href;
  const isSecureContext = url.startsWith("https:");
  // Set SameSite=None and Secure for HTTPS contexts, otherwise, set to 'None'
  return isSecureContext ? "none" : "lax";
}

let currentUser = null;

// Function to handle user sign-in
window.signIn = function() {
    signInWithPopup(auth, new GoogleAuthProvider())
        .then((result) => {
            console.log("User signed in:", result.user);
        })
        .catch((error) => {
            console.error("Error signing in:", error);
        });
}

// Function to handle user sign-out
window.signOutUser = function() {
    signOut(auth).then(() => {
        console.log("User signed out");
    }).catch((error) => {
        console.error("Error signing out:", error);
    });
}

// Monitor auth state
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        console.log("User is signed in:", user);
        getTasksFromFirestore();
    } else {
        currentUser = null;
        console.log("No user signed in");
        document.getElementById('task-list').innerHTML = ''; // Clear tasks
    }
});

// Function to add a task to Firestore
window.addTask = async function() {
    if (!currentUser) {
        console.log("No user signed in");
        return;
    }

    const taskInput = document.getElementById('task-input').value;
    const reminderTime = document.getElementById('reminder-time').value;
    
    try {
        await addDoc(collection(db, "tasks"), {
            userId: currentUser.uid,
            task: taskInput,
            reminderTime: reminderTime
        });
        console.log("Task added successfully!");
    } catch (error) {
        console.error("Error adding task:", error);
    }
}

// Function to update a task in Firestore
window.editTask = async function(taskId, newTask, newReminderTime) {
    if (!currentUser) {
        console.log("No user signed in");
        return;
    }

    try {
        const taskRef = doc(db, "tasks", taskId);
        await updateDoc(taskRef, {
            task: newTask,
            reminderTime: newReminderTime
        });
        console.log("Task updated successfully!");
    } catch (error) {
        console.error("Error updating task:", error);
    }
}

// Function to delete a task from Firestore
window.deleteTask = async function(taskId) {
    if (!currentUser) {
        console.log("No user signed in");
        return;
    }

    try {
        const taskRef = doc(db, "tasks", taskId);
        await deleteDoc(taskRef);
        console.log("Task deleted successfully!");
    } catch (error) {
        console.error("Error deleting task:", error);
    }
}

function getTasksFromFirestore() {
    if (!currentUser) {
        console.log("No user signed in");
        return;
    }

    const q = query(collection(db, "tasks"), where("userId", "==", currentUser.uid));
    onSnapshot(q, (snapshot) => {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = ''; // Clear previous tasks
        snapshot.forEach((doc) => {
            const taskData = doc.data();
            const taskText = taskData.task;
            const reminder = taskData.reminderTime;
            const li = document.createElement("li");
            li.textContent = `${taskText} - Reminder: ${reminder}`;
            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.classList.add("edit");
            editButton.onclick = () => {
                const newTask = prompt("Enter new task:", taskText);
                const newReminder = prompt("Enter new reminder time:", reminder);
                if (newTask && newReminder) {
                    window.editTask(doc.id, newTask, newReminder);
                }
            };
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.onclick = () => window.deleteTask(doc.id);
            li.appendChild(editButton);
            li.appendChild(deleteButton);
            taskList.appendChild(li);
        });
    }, (error) => {
        console.error("Error fetching tasks:", error);
    });
}

// Authentication UI
const authUI = document.getElementById('auth-ui');
const signInButton = document.createElement("button");
signInButton.textContent = "Sign In with Google   ";
signInButton.onclick = window.signIn;
const signOutButton = document.createElement("button");
signOutButton.textContent = "Sign Out";
signOutButton.onclick = window.signOutUser;
authUI.appendChild(signInButton);
authUI.appendChild(signOutButton);
