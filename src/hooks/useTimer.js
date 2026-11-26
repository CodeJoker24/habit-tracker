import { useContext } from 'react';
import { TimerContext } from '../context/TimerContext.jsx';

export const useTimer = () => useContext(TimerContext);
