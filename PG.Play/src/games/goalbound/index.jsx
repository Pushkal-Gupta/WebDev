// GOALBOUND — top-level shell and router.
//
//   Receives an optional `mode` prop from GameIntro. If given, routes
//   directly to the matching flow (quick match, shootout). Otherwise
//   lands on the full menu.
//
//   Owns the internal state machine between screens. All persistent
//   state lives in ./store.js. This file is just the route switch +
//   a resume banner when a tournament/challenge is mid-flight.

import { useEffect } from 'react';
import './styles.css';
import { useGoalboundStore, setRoute, useReducedMotionClass, markBooted } from './store.js';
import BootScreen        from './screens/Boot.jsx';
import MainMenu          from './screens/Menu.jsx';
import ModeSelect        from './screens/Mode.jsx';
import TeamSelect        from './screens/TeamSelect.jsx';
import Difficulty        from './screens/Difficulty.jsx';
import MatchSettings     from './screens/MatchSettings.jsx';
import TournamentSetup   from './screens/TournamentSetup.jsx';
import GroupStage        from './screens/GroupStage.jsx';
import Bracket           from './screens/Bracket.jsx';
import MatchIntro        from './screens/MatchIntro.jsx';
import MatchScreen       from './screens/Match.jsx';
import Results           from './screens/Results.jsx';
import StatsScreen       from './screens/Stats.jsx';
import Help              from './screens/Help.jsx';
import Challenges        from './screens/Challenges.jsx';
import ShootoutScreen    from './screens/Shootout.jsx';

export default function GoalboundGame({ mode = 'arcade' }) {
  const route = useGoalboundStore((s) => s.route);
  const bootedOnce = useGoalboundStore((s) => s.meta.bootedOnce);
  useReducedMotionClass();

  // Entry point: respect hard mode hints from the outer GameIntro,
  // otherwise route based on persisted last-seen screen.
  useEffect(() => {
    // First boot — pass through splash, then land on menu.
    if (!bootedOnce) return;

    if (mode === 'bot' || mode === 'quick') {
      // Direct quick match — jump to match settings so we retain some
      // pre-match choice without derailing users who clicked a shortcut.
      if (['boot'].includes(route)) setRoute('menu');
    } else if (mode === '2p') {
      // Local versus shortcut — also lands on menu. The menu exposes it.
      if (['boot'].includes(route)) setRoute('menu');
    } else if (mode === 'shootout') {
      setRoute('shootout');
    } else if (route === 'boot') {
      setRoute('menu');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, bootedOnce]);

  const onBootDone = () => {
    markBooted();
    setRoute('menu');
  };

  return (
    <div className="gb-shell">
      <RouteView route={route} onBootDone={onBootDone} initialMode={mode}/>
    </div>
  );
}

const RouteView = ({ route, onBootDone, initialMode }) => {
  switch (route) {
    case 'boot':              return <BootScreen onDone={onBootDone}/>;
    case 'menu':              return <MainMenu/>;
    case 'mode':              return <ModeSelect/>;
    case 'team-select':       return <TeamSelect/>;
    case 'difficulty':        return <Difficulty/>;
    case 'match-settings':    return <MatchSettings/>;
    case 'tournament-setup':  return <TournamentSetup/>;
    case 'group-stage':       return <GroupStage/>;
    case 'bracket':           return <Bracket/>;
    case 'match-intro':       return <MatchIntro/>;
    case 'match':             return <MatchScreen/>;
    case 'results':           return <Results/>;
    case 'stats':             return <StatsScreen/>;
    case 'help':              return <Help/>;
    case 'challenges':        return <Challenges/>;
    case 'shootout':          return <ShootoutScreen/>;
    default:                  return <MainMenu/>;
  }
};
