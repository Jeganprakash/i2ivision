import IO, { connect } from 'socket.io-client';
import Peer from 'react-native-peerjs';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { ID } from './authActions';

/** Web RTC */
import { mediaDevices } from 'react-native-webrtc';
import { ADD_REMOTE_STREAM, ADD_STREAM, ALL_USERS, MY_STREAM } from './types';

//** API_URI */
export const API_URI = `https://00f3547a59be.ngrok.io`;
console.log(API_URI)


// const peerServer = new Peer(undefined, {
//   host: '192.168.1.8',
//   port: 5000,
//   path: "/peerjs"
// })
// const peerServer = new Peer(undefined, {
//   host: "192.168.1.8",
//   path: "/peerjs",
//   secure: false,
//   port: 5000,
//   config: {
//     iceServers: [
//       {
//         urls: [
//           'stun:stun1.l.google.com:19302',
//           'stun:stun2.l.google.com:19302',
//         ],
//       },
//     ],
//   },
// }
// );

//peerServer.on('open', (id) => console.log("peer open", id))
//peerServer.on('error', (error) => console.log(error));


//** Socket Config */
export const socket = IO(`${API_URI}`, {

  forceNew: true,
  reconnection: true,
});
console.log(socket)
socket.on('connect', (socket) => console.log('connected', socket))
socket.on('error', console.error)
socket.on('connect_error', console.error)


socket.emit('hey', "i am alive")
//socket.on('connection', () => console.log('Connection'));


export const joinGeneralRoom = () => async (dispatch) => {
  socket.emit('join-general-room', 'ajsdflajslkdfuaisfjwioerwqiheriyqw87ery');
};

export const userJoin = () => async (dispatch, getState) => {
  const allUserRoomID = 'skdjksdsjkdnksdnksjd'
  const roomID = 'active_room_id';
  const { user, allUsers } = getState().auth;

  //User Exists
  console.log("from client user-exists ", socket.id, allUsers, user)
  socket.emit("user-exists", { user, socketID: socket.id });
  socket.on('disconnect', () => {
    console.log('disconnected babe')
  })
  socket.on('user-found', (currentUser) => {
    console.log("from client user-join ", user)
    if (currentUser) {
      socket.emit('update-user', {
        user,
        socketID: socket.id,
        allUserRoomID
      });
    }
    else {
      console.log("from client user-join ", user)
      socket.emit('user-join', { allUserRoomID, user, socketID: socket.id });
    }
  })

  //** Get other users */
  socket.on('activeUsers', (users) => {

    const eUsers = allUsers.map(({ email }) => email);
    console.log("allUsers:", eUsers)

    const fUsers = users.map(({ email, name, socketID, uuid, _id }) => {
      if (!eUsers.includes(email)) {
        return {
          email,
          name, socketID, uuid, _id,
        };
      }
    }).filter((data) => data !== undefined);
    console.log("fusers")
    //Get all users
    dispatch({ type: ALL_USERS, payload: fUsers })
    console.log("ALL userz", getState().auth)

  });

  //Get new User join


  socket.on('new-user-join', (user) => {
    console.log("from new user join", user)
    dispatch({ type: 'ADD_NEW_USER', payload: user })
  })
};

// Stream Actions
export const joinStream = (stream) => async (dispatch, getState) => {
  const { user } = getState().auth;
  console.log("from joinstream", user)
  const roomID = 'stream_general_room';
  dispatch({ type: MY_STREAM, payload: stream });
  dispatch({
    type: ADD_STREAM,
    payload: {
      stream,
      ...user,
    },
  })

  const peerServer2 = new Peer(undefined, {
    host: "00f3547a59be.ngrok.io",
    path: "/peerjs",
    secure: true,
    port: 443,
    config: {
      iceServers: [
        {
          urls: [
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302',
          ],
        },
      ],
    },
  }
  );

  peerServer2.on('open', (peerID) => {
    console.log("peer server open finally", peerID)
    socket.emit('join-stream-room', {
      roomID,
      peerID,
      socketID: socket.id,
      user,

    });


  })
  socket.on('user-connected', ({ peerID, user, roomID, socketID }) => {
    console.log('user-connected now connect to nw user')
    // connectToNewUser(peerID, user, roomID, socketID, stream, peerServer2)

    console.log("connectToNewUser", peerID, roomID, peerServer2)
    const call = peerServer2.call(peerID, stream);

    //remote users answers the last connected device
    call.on('stream', (lastusersstream) => {
      if (lastusersstream) {
        dispatch({
          type: ADD_REMOTE_STREAM,
          payload: {
            stream, lastusersstream,
            ...user,
          },
        })
      }
    })
  });
  console.log("dispatch", dispatch)
  //Last Users Recieves a call
  peerServer2.on('call', call => {
    //Answer back to all remote stream
    call.answer(stream);
    console.log("wow")

    //answer the remote calls back from the last device
    call.on('stream', (remoteStreams) => {
      //Add other streams to stream arrays
      dispatch({
        type: ADD_STREAM,
        payload: {
          stream: remoteStreams,
          name: `user_${ID()}`,
          uuid: `id_${ID()}`,
          email: 'remoteUser@gmail.com'
        }
      })
    })
  })
};



function connectToNewUser(peerID, user, roomID, socketID, stream, peerServer2) {
  //call the last user from other devices


}

export const disconnect = () => async () => {
  // peerServer.disconnect();
};

export const stream = () => async (dispatch) => {
  let isFront = true;
  mediaDevices.enumerateDevices().then((sourceInfos) => {
    let videoSourceId;
    for (let i = 0; i < sourceInfos.length; i++) {
      const sourceInfo = sourceInfos[i];
      if (
        sourceInfo.kind == 'videoinput' &&
        sourceInfo.facing == (isFront ? 'front' : 'environment')
      ) {
        videoSourceId = sourceInfo.deviceId;
      }
    }

    mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          mandatory: {
            minWidth: 500,
            minHeight: 300,
            minFrameRate: 30,
          },
          facingMode: isFront ? 'user' : 'environment',
          optional: videoSourceId ? [{ sourceId: videoSourceId }] : [],
        },
      })
      .then((stream) => {
        console.log("gottem stream", stream)
        dispatch(joinStream(stream));
      })
      .catch((error) => {
        console.log(error);
      });
  });
};
