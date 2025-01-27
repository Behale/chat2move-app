import React, {useContext} from 'react';
import {Socket} from 'phoenix';
import throttle from 'lodash/throttle';

import * as API from '../api';
import {noop} from '../utils';
import logger from '../logger';
import {isDev} from '../config';

// TOOD: figure out why ngrok doesn't seem to work here?
// const SOCKET_URL = 'ws://localhost:4000/socket';
export const SOCKET_URL = isDev
  ? 'wss://localhost:4000/socket'
  : 'wss://chat2move.herokuapp.com/socket';

export const SocketContext = React.createContext<{
  socket: Socket;
  hasConnectionError?: boolean;
}>({
  socket: new Socket(SOCKET_URL),
  hasConnectionError: false,
});

export const useSocket = () => useContext(SocketContext);

type Props = {
  url?: string;
  params?: Record<string, string>;
  options?: any;
  refresh: (token: string) => Promise<void>;
} & React.PropsWithChildren<{}>;

type State = {
  socket: Socket;
  history: Array<Socket>;
};

export class SocketProvider extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const {url = SOCKET_URL, params = {}} = this.props;
    const socket = new Socket(url, {params});

    this.state = {
      socket,
      history: [],
    };
  }

  async componentDidMount() {
    const {url = SOCKET_URL} = this.props;
    const token = await API.getAccessToken();
    const socket = new Socket(url, {
      params: {token},
    });

    this.setState({socket, history: [socket]}, () => this.connect());
  }

  componentWillUnmount() {
    this.disconnect();
  }

  createNewSocket = async () => {
    const {url = SOCKET_URL} = this.props;
    const token = await API.getAccessToken();

    return new Socket(url, {params: {token}});
  };

  connect = () => {
    const {socket} = this.state;

    socket.connect();

    socket.onOpen(() => {
      console.debug(`Successfully connected to socket!`);
    });

    socket.onClose(() => {
      console.debug(`Socket successfully closed!`);
    });

    socket.onError(
      throttle(() => {
        logger.error(
          `Error connecting to socket. Try refreshing the app.`,
          socket
        );

        this.reconnect();
      }, 30000)
    );
  };

  reconnect = () => {
    this.disconnect(async () => {
      const token = await API.getRefreshToken();

      if (!token) {
        // Attempt connect again
        return this.connect();
      }

      await this.props.refresh(token);

      const socket = await this.createNewSocket();

      this.setState({socket, history: [socket, ...this.state.history]}, () =>
        this.connect()
      );
    });
  };

  disconnect = (cb = noop) => {
    const {socket} = this.state;

    socket.disconnect(cb);
  };

  render() {
    return (
      <SocketContext.Provider value={{socket: this.state.socket}}>
        {this.props.children}
      </SocketContext.Provider>
    );
  }
}

export default SocketProvider;
