import { ADD_REMOTE_STREAM, ADD_STREAM, MY_STREAM } from '../actions/types';

const initialState = {
  myStream: null,
  streams: [],
  remoteStreams: [],
};

export default (state = initialState, { type, payload }) => {
  switch (type) {
    case MY_STREAM:
      console.log("Stream initialized")
      return {
        ...state,
        myStream: payload,
      }
    case ADD_STREAM:
      const streams = state.streams.filter(({ email }) => payload.email !== email)
      return {
        ...state,
        streams: [...streams, payload],

      }
    case ADD_REMOTE_STREAM:
      const otherStreams = state.streams.filter(({ email }) => payload.email !== email);
      return {
        ...state,
        streams: [...otherStreams, payload]
      }
    default:
      return state;
  }
};
