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
  getDoc,
  Timestamp,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";

import EditEvent from "./components/EditEvent";
import EditUser from "./components/EditUser";
import AddEvent from "./components/AddEvent";
import Event from "./components/Event";
import EventCard from "./components/EventCard";
import UserCard from "./components/UserCard";
import EventTable from "./components/EventTable";
import User from "./components/User";
import UnlockModal from "./components/UnlockModal";
import "./App.css";

function App() {
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editEvent, setEditEvent] = useState({});
  const [openEditUserModal, setOpenEditUserModal] = useState(false);
  const [editUser, setEditUser] = useState({});
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openUnlockModal, setOpenUnlockModal] = useState(false);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [bookingDetails, setBookingDetails] = useState([]);

  const handleOkClick = (cardData) => {
    checkRecordExists("users", "ipAddress", localStorage.getItem("NS_KWGC"))
      .then((exists) => {
        if (!exists) {
          createUser(cardData.name, 1, 0, isWithin4Days(cardData.deadline));
        }
      })
      .catch((error) => {
        alert("checkRecordExists Error:", error);
      });

    handleUpdateEvent(cardData);
    // handleUpdateUser(1, 0, isWithin4Days(cardData.deadline) ? 0 : 1);
    createBookingDetail(true, cardData.title, cardData.id, cardData.name, cardData);
  };

  const isWithin4Days = (timestampField) => {
    if (!timestampField) {
      return false;
    }

    let currentTime = new Date();
    let fourDaysAgo = new Date(timestampField.toDate());

    const options = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      // hour: 'numeric',
      // minute: 'numeric',
      // second: 'numeric',
      // hour12: false, // Use 24-hour format
    };
    currentTime = currentTime.toLocaleString(undefined, options);
    fourDaysAgo = fourDaysAgo.toLocaleString(undefined, options);

    return currentTime > fourDaysAgo;
  };

  const handleCancelClick = (cardData) => {
    checkRecordExists("users", "ipAddress", localStorage.getItem("NS_KWGC"))
      .then((exists) => {
        if (!exists) {
          createUser(cardData.removeName, 0, 1, isWithin4Days(cardData.deadline));
        }
      })
      .catch((error) => {
        alert("checkRecordExists Error:", error);
      });

    handleUpdateEvent(cardData);
    // handleUpdateUser(0, 1, isWithin4Days(cardData.time) ? 0 : 1);
    createBookingDetail(false, cardData.title, cardData.id, cardData.removeName, cardData);
  };

  const handleDoneClick = (cardData) => {
    handleUpdateEvent(cardData);
  };

  const handleUnlockClick = (password) => {
    if (password === process.env.REACT_APP_PASSWORD) {
      setOpenUnlockModal(false);
      setIsAdmin(true);
    }
  };

  const handleEditEventClick = (data) => {
    setOpenEditModal(true);
    setEditEvent(data);
  };

  const handleEditUserClick = (data) => {
    setOpenEditUserModal(true);
    setEditUser(data);
  };

  const handleUpdateUser = async (ok, cancel, delay) => {
    const fieldNameToQuery = "ipAddress";

    const q = query(
      collection(db, "users"),
      where(fieldNameToQuery, "==", localStorage.getItem("NS_KWGC")),
      where("active", "==", true),
      limit(1)
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
            updated: Timestamp.now(),
          })
            .then(() => {
              console.log("Document updated successfully.");
            })
            .catch((error) => {
              alert("Error updating document:", error);
            });
        });
      })
      .catch((error) => {
        alert("Error querying Firestore:", error);
      });
  };
  const handleUpdateEvent = async (cardData) => {
    const eventDocRef = doc(db, "events", cardData.id);
    try {
      await updateDoc(eventDocRef, {
        completed: cardData.completed,
        members: cardData.members,
        updated: Timestamp.now(),
      });
    } catch (err) {
      alert("handleUpdateEvent error: " + err);
    }
  };

  const createBookingDetail = async (ok, title, eventId, name, cardData) => {
    try {
      await addDoc(collection(db, "booking_details"), {
        type: ok ? "OK" : "CANCEL",
        title: title,
        ipAddress: localStorage.getItem("NS_KWGC"),
        eventId: eventId,
        name: name,
        delay: isWithin4Days(cardData.deadline),
        created: Timestamp.now(),
        updated: Timestamp.now(),
      });
    } catch (err) {
      alert("createBookingDetail error: " + err);
    }
  };

  const createUser = async (newMember, ok = 0, cancel = 0, delay = 0) => {
    try {
      await addDoc(collection(db, "users"), {
        ipAddress: localStorage.getItem("NS_KWGC"),
        name: newMember,
        ok: ok,
        cancel: cancel,
        delay: delay,
        point: 0,
        active: true,
        created: Timestamp.now(),
        updated: Timestamp.now(),
      });
    } catch (err) {
      alert("createUser error: " + err);
    }
  };

  const checkRecordExists = (
    collectionName,
    fieldNameToCheck,
    valueToCheck
  ) => {
    const q = query(
      collection(db, collectionName),
      where(fieldNameToCheck, "==", valueToCheck),
      where("active", "==", true),
      limit(1)
    );

    // Return a promise that resolves to true if the record exists, false otherwise
    return getDocs(q)
      .then((querySnapshot) => !querySnapshot.empty)
      .catch((error) => {
        alert("Error checkRecordExists: ", error);
        return false; // Return false in case of an error
      });
  };

  const googleMaps = {
    "戸田スポーツセンター": "https://maps.app.goo.gl/gLnQ2cNd6dMsWBJW9",
    "西スポーツセンター": "https://maps.app.goo.gl/EgsquvSXjHhQqiEa8",
    "体育武道センター": "https://maps.app.goo.gl/Gba8wyF9FUMftkHZ7",
    "戸塚スポーツセンター": "https://maps.app.goo.gl/KGdkLbNwQP6kH5Dp9",
    "北スポーツセンター": "https://maps.app.goo.gl/fHzGe57Byc5RVqpU9",
    "芝スポーツセンター": "https://maps.app.goo.gl/f6t3UEiKs6FVm7ZZ9",
    "東スポーツセンター": "https://maps.app.goo.gl/zEbJjoUi2nJ7tfSM9",
    "安行スポーツセンター": "https://maps.app.goo.gl/yruzsYEVJzjw5j2e9",
    "鳩ヶ谷スポーツセンター": "https://maps.app.goo.gl/XLTH1qyLJMoAMjvf9",
  }

  const addNewFieldToExistDocument = (updateCollection, newField, newValue) => {
    const collectionName = updateCollection;

    // Reference the collection
    const collectionRef = collection(db, collectionName);

    // Use a query to fetch all documents in the collection
    const q = query(collectionRef);

    getDocs(q)
      .then((querySnapshot) => {
        querySnapshot.forEach((_doc) => {
          // Use the update method to add the new field to each document
          const docRef = doc(db, collectionName, _doc.id);
          // const id = _doc.data().eventId;
          // console.log(obj[ip]);
          // newValue = getFirstUser(ip);
          // console.log(newValue);
          // const getFirstUser = (ipAddress) => {
          // const docR = doc(db, 'events', id);

          // getDoc(docR).then((dt) => {
          //   const tmp = dt.data();
          //   console.log(tmp);
          //   if (tmp.deadline) {
          //     newValue = isWithin4Days(tmp.deadline);
          //   } else {
          //     console.log(dt.id);
          //   }

          //   console.log(newValue);
            updateDoc(docRef, {
              [newField]: newValue,
            });
          });

            
          
        
            // getDocs(q)
            //   .then((_querySnapshot) => {
            //     _querySnapshot.forEach((__doc) => {
            //       const data = __doc.data();
            //       newValue = isWithin4Days(data.deadline);
            //       console.log(newValue);
            //       // console.log(data.name);
            //       // return data.name;
            //       // obj[data.ipAddress] = data.name;
            //                 updateDoc(docRef, {
            //               [newField]: newValue,
            //               //   // updated: Timestamp.now(),
            //               });
            //     });
            //   })
            //   .catch((error) => {
            //     alert("Error querying Firestore:", error);
            //   });
          // }
        // });
      })
      .then(() => {
        console.log("Added the new field to all documents in the collection.");
      })
      .catch((error) => {
        alert("Error adding the new field: ", error);
      });
  };

  const updateData = async (_collection) => {
    try {
      const collectionRef = collection(db, _collection); // Replace with your collection name
      const querySnapshot = await getDocs(collectionRef);

      const batch = [];
      querySnapshot.forEach((_doc) => {
        // const acc = _doc.data().account;
        // const desc = _doc.data().description;
        // const newValue = desc.split(" ")[0];
        const ip = _doc.data().ipAddress;
        // const newValue = getFirstUser(ip);
        // console.log(newValue);

        // const oldValue = _doc.data().time.toDate(); // Replace with your field name
        // const parsedDate = new Date(oldValue);
        // parsedDate.setDate(parsedDate.getDate() - 4);
        // const newValue = parsedDate;

        const docRef = doc(db, _collection, _doc.id); // Replace with your collection name
        batch.push(updateDoc(docRef, { userName: 'Thanh' })); // Replace with your field name
      });

      console.log(batch);

      // await Promise.all(batch);

      console.log("All documents updated successfully.");
    } catch (error) {
      alert(`Error updating documents: ${error.message}`);
    }
  };

  useEffect(() => {
    // addNewFieldToExistDocument('events', 'isSameDay', false);
    // updateData('booking_details');

    const eventColRef = query(
      collection(db, "events"),
      orderBy("reservedDate")
    );
    onSnapshot(eventColRef, (snapshot) => {
      const data = [];
      snapshot.docs.map((_doc) => {
        data.push({
          id: _doc.id,
          data: _doc.data(),
        });
      });

      data.sort((a, b) => {
        const dateA = a.data.title.split(", ")[1];
        const dateB = b.data.title.split(", ")[1];
        if (dateA === dateB) {
          return a.data.reservedTime.localeCompare(b.data.reservedTime);
        }
      });

      setEvents(data);
    });

    // const userColRef = query(
    //   collection(db, "users"),
    //   orderBy("updated", "desc")
    // );
    // onSnapshot(userColRef, (snapshot) => {
    //   const data = [];
    //   snapshot.docs.map((_doc) => {
    //     data.push({
    //       id: _doc.id,
    //       data: _doc.data(),
    //     });
    //   });

    //   setUsers(data);
    // });

    const bookingDetailsColRef = query(
      collection(db, "booking_details"),
      orderBy("updated", "desc"),
      limit(9),
    );
    onSnapshot(bookingDetailsColRef, (snapshot) => {
      const data = [];
      snapshot.docs.map((_doc) => {
        data.push({
          id: _doc.id,
          data: _doc.data(),
        });
      });

      setBookingDetails(data);
    });

    fetch("https://api.db-ip.com/v2/free/self")
      .then((response) => response.json())
      .then((data) => {
        localStorage.setItem("NS_KWGC", data.ipAddress);
        setIsAdmin(data.ipAddress === process.env.REACT_APP_IPV4_ADDRESS);
      });
  }, []);

  // console.log(bookingDetails);

  return (
    <div className="App">
      <div className="flex flex-col justify-center items-center">
        {isAdmin ? (
          <button
            onClick={() => {
              // console.log(obj);
              // addNewFieldToExistDocument('booking_details', 'name', '');
              setOpenAddModal(true);
            }}

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
          {events.map((event) => {
            return (
              !event.data.completed && (
                <Event
                  id={event.id}
                  key={event.id}
                  time={event.data.time}
                  title={event.data.title}
                  account={event.data.account}
                  description={event.data.description}
                  map={event.data.map}
                  amount={event.data.amount}
                  members={event.data.members}
                  completed={event.data.completed}
                  note={event.data.note}
                  deadline={event.data.deadline}
                  participant={event.data.participant}
                  isSameDay={event.data.isSameDay}
                  onOkClick={handleOkClick}
                  onCancelClick={handleCancelClick}
                  onDoneClick={handleDoneClick}
                  onUpdateEvent={handleUpdateEvent}
                  isAdmin={isAdmin}
                />
              )
            );
          })}
        </div>
        {isAdmin && (
          <div className="mt-10">
            {openEditModal && (
              <EditEvent
                onClose={() => setOpenEditModal(false)}
                open={openEditModal}
                event={editEvent}
              />
            )}
            <EventTable events={events} onClickRow={handleEditEventClick} />
          </div>
        )}

        {/* <div className="container mx-auto py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8">
            {events.map((event) => {
              return (
                !event.data.completed && (
                  <EventCard
                    id={event.id}
                    key={event.id}
                    title={event.data.title}
                    account={event.data.account}
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
              );
            })}
          </div>
        </div> */}

        {isAdmin && (
          <div className="mt-10">
            {openEditUserModal && (
              <EditUser
                onClose={() => setOpenEditUserModal(false)}
                open={openEditUserModal}
                user={editUser}
              />
            )}
          </div>
        )}

        <div className="container mx-auto py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-8">
            {bookingDetails.map((booking) => {
              // console.log(booking);
              // addNewFieldToExistDocument('booking_details', 'name', '');
              return (
                  <UserCard key={booking.id} bookingDetail={booking.data}/>
              );
            })}
          </div>
        </div>

        {/* {isAdmin && (
          <div className="mt-10">
            <User users={users} onClickRow={handleEditUserClick} />
          </div>
        )} */}
      </div>
    </div>
  );
}

export default App;
