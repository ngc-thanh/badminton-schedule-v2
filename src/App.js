import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  where,
  getDocs,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

import AddEvent from "./components/AddEvent";
import Event from "./components/Event";
import User from "./components/User";
import UnlockModal from "./components/UnlockModal";
import "./App.css";

function App() {
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openUnlockModal, setOpenUnlockModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentIp, setCurrentIp] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  const handleOkClick = (cardData) => {
    const newMember = cardData.members[cardData.members.length - 1];
    if (isNewUser) {
      createUser(newMember);
      setIsNewUser(false);
    } else {
      for (let i = 0; i < users.length; i++) {
        if (users[i].data.ipAddress === currentIp) {
          break;
        } else {
          setIsNewUser(true);
        }
      }

      if (isNewUser) {
        createUser(newMember);
        setIsNewUser(false);
      }
    }

    handleUpdateEvent(cardData);
    handleUpdateUser(1, 0, isWithin4Days(cardData.time) ? 0 : 1);
    createBookingDetail(true, cardData.title, cardData.id);
  };

  const isWithin4Days = (timestampField) => {
    if (!timestampField) {
      return false;
    }

    const currentTime = new Date();
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    return currentTime < timestampField && timestampField > fourDaysAgo;
  };

  const handleCancelClick = (cardData) => {
    handleUpdateEvent(cardData);
    handleUpdateUser(1, 0, isWithin4Days(cardData.time) ? 0 : 1);
    createBookingDetail(false, cardData.title, cardData.id);
  };

  const handleDoneClick = (cardData) => {
    handleUpdateEvent(cardData);
  };

  const handleUnlockClick = (password) => {
    console.log(password);
    if (password === process.env.REACT_APP_PASSWORD) {
      setOpenUnlockModal(false);
      setIsAdmin(true);
    }
  };

  const handleUpdateUser = async (ok, cancel, delay) => {
    const fieldNameToQuery = "ipAddress";

    const q = query(
      collection(db, "users"),
      where(fieldNameToQuery, "==", currentIp)
    );

    getDocs(q)
      .then((querySnapshot) => {
        querySnapshot.forEach((_doc) => {
          const data = _doc.data();
          const docRef = doc(db, "users", _doc.id);
          updateDoc(docRef, {
            ok: data.ok + ok,
            cancel: data.cancel + cancel,
            delay: data.delay + delay,
          })
            .then(() => {
              console.log("Document updated successfully.");
            })
            .catch((error) => {
              console.error("Error updating document:", error);
            });
        });
      })
      .catch((error) => {
        console.error("Error querying Firestore:", error);
      });
  };
  const handleUpdateEvent = async (cardData) => {
    const eventDocRef = doc(db, "events", cardData.id);
    try {
      await updateDoc(eventDocRef, {
        completed: cardData.completed,
        members: cardData.members,
      });
    } catch (err) {
      alert('handleUpdateEvent error: ' + err);
    }
  };

  const createBookingDetail = async (ok, title, eventId) => {
    try {
      await addDoc(collection(db, "booking_details"), {
        type: ok ? "OK" : "CANCEL",
        title: title,
        ipAddress: currentIp,
        eventId: eventId,
        created: Timestamp.now(),
      });
    } catch (err) {
      alert('createBookingDetail error: ' + err);
    }
  };

  const createUser = async (newMember) => {
    try {
      await addDoc(collection(db, "users"), {
        ipAddress: currentIp,
        name: newMember,
        ok: 0,
        cancel: 0,
        delay: 0,
        point: 0,
        active: true,
        created: Timestamp.now(),
      });
    } catch (err) {
      alert('createUser error: ' + err);
    }
  };

  const checkRecordExists = (
    collectionName,
    fieldNameToCheck,
    valueToCheck
  ) => {
    const q = query(
      collection(db, collectionName),
      where(fieldNameToCheck, "==", valueToCheck)
    );

    // Return a promise that resolves to true if the record exists, false otherwise
    return getDocs(q)
      .then((querySnapshot) => !querySnapshot.empty)
      .catch((error) => {
        console.error("Error checkRecordExists: ", error);
        return false; // Return false in case of an error
      });
  };

  useEffect(() => {
    const eventColRef = query(
      collection(db, "events"),
      orderBy("time", "asc")
    );
    onSnapshot(eventColRef, (snapshot) => {
      setEvents(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data(),
        }))
      );
    });

    const userColRef = query(
      collection(db, "users"),
      orderBy("created", "desc")
    );
    onSnapshot(userColRef, (snapshot) => {
      setUsers(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data(),
        }))
      );
    });

    fetch("https://api.db-ip.com/v2/free/self")
      .then((response) => response.json())
      .then((data) => {
        setCurrentIp(data.ipAddress);
        setIsAdmin(
          data.ipAddress === process.env.REACT_APP_IPV4_ADDRESS
        );
      });

    checkRecordExists("users", "ipAddress", currentIp)
      .then((exists) => {
        setIsNewUser(exists);
      })
      .catch((error) => {
        console.error("checkRecordExists Error:", error);
      });
  }, []);

  return (
    <div className="App">
      <div className="flex flex-col justify-center items-center">
        {isAdmin ? (
          <button
            onClick={() => setOpenAddModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-semibold transition duration-300 ease-in-out w-30 mt-5"
          >
            Thêm sân +
          </button>
        ) : (
          <button
            onClick={() => setOpenUnlockModal(true)}
            className="px-4 py-2 bg-red-300 hover:bg-red-600 text-white rounded-md font-semibold transition duration-300 ease-in-out w-30 mt-5"
          >
            MỞ KHÓA
          </button>
        )}
      </div>
      {openAddModal && (
        <AddEvent onClose={() => setOpenAddModal(false)} open={openAddModal} />
      )}

      {openUnlockModal && (
        <UnlockModal
          onClose={() => setOpenUnlockModal(false)}
          open={openUnlockModal}
          onUnlock={handleUnlockClick}
        />
      )}
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8">
          {events.map(
            (event) =>
              !event.data.completed && (
                <Event
                  id={event.id}
                  key={event.id}
                  title={event.data.title}
                  description={event.data.description}
                  amount={event.data.amount}
                  members={event.data.members}
                  completed={event.data.completed}
                  note={event.data.note}
                  deadline={event.data.deadline}
                  participant={event.data.participant}
                  onOkClick={handleOkClick}
                  onCancelClick={handleCancelClick}
                  onDoneClick={handleDoneClick}
                  isAdmin={isAdmin}
                />
              )
          )}
        </div>
        {isAdmin && (
          <div className="mt-10">
            <User users={users} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
