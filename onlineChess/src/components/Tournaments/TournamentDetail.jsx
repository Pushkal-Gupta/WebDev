import { useEffect, useRef, useState } from 'react';
import styles from './TournamentsPage.module.css';
import useTournamentStore from '../../store/tournamentStore';
import useAuthStore from '../../store/authStore';
import useRatingStore from '../../store/ratingStore';
import { supabase } from '../../utils/supabase';

function formatTC(tc) {
  if (!tc) return '—';
  const min = Math.floor((tc.initialTime || 0) / 60);
  const sec = (tc.initialTime || 0) % 60;
  const base = sec > 0 ? `${min}:${String(sec).padStart(2,'0')}` : `${min}`;
  return tc.increment ? `${base}+${tc.increment}` : base;
}

function Countdown({ startsAt }) {
  const [label, setLabel] = useState('');
  useEffect(() => {
    const tick = () => {
      const diff = new Date(startsAt) - Date.now();
      if (diff <= 0) { setLabel('Starting now'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startsAt]);
  return <span className={styles.countdown}>{label}</span>;
}

export default function TournamentDetail({ tournamentId, onBack }) {
  const { activeTournament, detailLoading, loadTournament,
          register, withdraw, generateNextRound, recordResult,
          subscribeToTournament } = useTournamentStore();
  const { user, username } = useAuthStore();
  const { myRatings } = useRatingStore();
  const [activeTab, setActiveTab] = useState('standings');
  const [acting, setActing]       = useState(false);
  const [err, setErr]             = useState('');
  const channelRef = useRef(null);

  useEffect(() => {
    loadTournament(tournamentId);
    channelRef.current = subscribeToTournament(tournamentId);
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [tournamentId]); // eslint-disable-line

  const t = activeTournament;
  if (detailLoading || !t) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={onBack}>← Tournaments</button>
        <div className={styles.loading}>Loading…</div>
      </div>
    );
  }

  const isRegistered = t.players.some(p => p.user_id === user?.id);
  const isCreator    = t.created_by === user?.id;
  const isOpen       = t.status === 'registration';
  const isActive     = t.status === 'active';
  const isFinished   = t.status === 'finished';

  const sortedPlayers = [...t.players].sort((a, b) =>
    b.score - a.score || b.buchholz - a.buchholz || b.seed_rating - a.seed_rating
  );

  const roundNums = [...new Set(t.pairings.map(p => p.round))].sort((a, b) => a - b);
  const currentRoundPairings = t.pairings.filter(p => p.round === t.current_round);
  const allResultsIn = currentRoundPairings.length > 0 &&
    currentRoundPairings.every(p => p.result !== null);

  const handleRegister = async () => {
    if (!user) return;
    setActing(true); setErr('');
    const cat = t.category?.toLowerCase();
    const seedRating = myRatings[cat]?.rating || 1500;
    try { await register(tournamentId, user.id, username || user.email, seedRating); }
    catch (e) { setErr(e.message); }
    setActing(false);
  };

  const handleWithdraw = async () => {
    setActing(true); setErr('');
    try { await withdraw(tournamentId, user.id); }
    catch (e) { setErr(e.message); }
    setActing(false);
  };

  const handleNextRound = async () => {
    setActing(true); setErr('');
    try { await generateNextRound(tournamentId); }
    catch (e) { setErr(e.message); }
    setActing(false);
  };

  const handleResult = async (pairingId, result) => {
    setActing(true); setErr('');
    try { await recordResult(pairingId, result); }
    catch (e) { setErr(e.message); }
    setActing(false);
  };

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={onBack}>← Tournaments</button>

      {/* Header */}
      <div className={styles.detailHeader}>
        <div>
          <h2 className={styles.title}>{t.name}</h2>
          <div className={styles.detailMeta}>
            <span className={`${styles.status} ${styles[
              t.status === 'registration' ? 'statusOpen' :
              t.status === 'active'       ? 'statusLive' :
              t.status === 'finished'     ? 'statusDone' : 'statusUpcoming'
            ]}`}>{t.status}</span>
            <span>{t.format} · {formatTC(t.time_control)}</span>
            {t.format === 'swiss' && (
              <span>Round {t.current_round}/{t.num_rounds}</span>
            )}
            <span>{t.players.length}/{t.max_players} players</span>
            {!isActive && !isFinished && <Countdown startsAt={t.starts_at} />}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.detailActions}>
          {err && <span className={styles.fieldErr}>{err}</span>}
          {user && isOpen && !isRegistered && (
            <button className={styles.registerBtn} onClick={handleRegister} disabled={acting}>
              {acting ? '…' : 'Register'}
            </button>
          )}
          {user && isOpen && isRegistered && (
            <button className={styles.withdrawBtn} onClick={handleWithdraw} disabled={acting}>
              {acting ? '…' : 'Withdraw'}
            </button>
          )}
          {isCreator && isActive && allResultsIn && t.current_round < t.num_rounds && (
            <button className={styles.roundBtn} onClick={handleNextRound} disabled={acting}>
              {acting ? '…' : `Start Round ${t.current_round + 1}`}
            </button>
          )}
          {isCreator && t.players.length >= 2 && t.status === 'registration' && (
            <button className={styles.roundBtn} onClick={handleNextRound} disabled={acting}>
              {acting ? '…' : 'Start Round 1'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.detailTabs}>
        <button className={`${styles.dTab} ${activeTab === 'standings' ? styles.dTabActive : ''}`}
          onClick={() => setActiveTab('standings')}>Standings</button>
        <button className={`${styles.dTab} ${activeTab === 'pairings' ? styles.dTabActive : ''}`}
          onClick={() => setActiveTab('pairings')}>Pairings</button>
      </div>

      {/* Standings */}
      {activeTab === 'standings' && (
        <div className={styles.tableWrap}>
          {sortedPlayers.length === 0
            ? <div className={styles.empty}>No players registered yet.</div>
            : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.thRank}>#</th>
                    <th className={styles.thPlayer}>Player</th>
                    <th style={{textAlign:'right',padding:'8px 12px',fontSize:'0.62rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.09em',color:'rgba(0,255,245,0.45)'}}>Score</th>
                    <th style={{textAlign:'right',padding:'8px 12px',fontSize:'0.62rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.09em',color:'rgba(0,255,245,0.45)'}}>TB</th>
                    <th style={{textAlign:'right',padding:'8px 12px',fontSize:'0.62rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.09em',color:'rgba(0,255,245,0.45)'}}>Rating</th>
                    <th style={{textAlign:'right',padding:'8px 12px',fontSize:'0.62rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.09em',color:'rgba(0,255,245,0.45)'}}>W/L/D</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((p, i) => (
                    <tr key={p.user_id} className={`${styles.row} ${p.user_id === user?.id ? styles.rowMe : ''}`}>
                      <td className={styles.tdRank}>{i + 1}</td>
                      <td className={styles.tdPlayer}>
                        <span className={styles.playerName}>{p.username}</span>
                        {p.user_id === user?.id && <span className={styles.youBadge}>you</span>}
                      </td>
                      <td style={{textAlign:'right',padding:'10px 12px',fontWeight:700,color:'#00fff5',fontVariantNumeric:'tabular-nums'}}>{p.score}</td>
                      <td style={{textAlign:'right',padding:'10px 12px',color:'rgba(255,255,255,0.38)',fontSize:'0.78rem',fontVariantNumeric:'tabular-nums'}}>{parseFloat(p.buchholz).toFixed(1)}</td>
                      <td style={{textAlign:'right',padding:'10px 12px',color:'rgba(255,255,255,0.55)',fontVariantNumeric:'tabular-nums'}}>{p.seed_rating}</td>
                      <td style={{textAlign:'right',padding:'10px 12px',fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap'}}>
                        <span className={styles.wins}>{p.wins}</span>
                        <span className={styles.sep}>/</span>
                        <span className={styles.losses}>{p.losses}</span>
                        <span className={styles.sep}>/</span>
                        <span className={styles.draws}>{p.draws}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </div>
      )}

      {/* Pairings */}
      {activeTab === 'pairings' && (
        <div className={styles.tableWrap}>
          {roundNums.length === 0
            ? <div className={styles.empty}>No pairings yet. Register and wait for Round 1.</div>
            : roundNums.map(rNum => (
              <div key={rNum} className={styles.roundBlock}>
                <div className={styles.roundLabel}>Round {rNum}</div>
                {t.pairings.filter(p => p.round === rNum).map(p => {
                  const white = t.players.find(pl => pl.user_id === p.white_user_id);
                  const black = p.black_user_id ? t.players.find(pl => pl.user_id === p.black_user_id) : null;
                  const canEdit = isCreator && isActive && !p.result && p.black_user_id;

                  return (
                    <div key={p.id} className={styles.pairingRow}>
                      <span className={`${styles.pColor} ${styles.pWhite}`}><span style={{display:'inline-block',width:10,height:10,background:'#fff',borderRadius:2}}/></span>
                      <span className={styles.pName}>{white?.username || '?'}</span>
                      {p.result === 'white'  && <span className={styles.pResult} style={{color:'#6fdc8c'}}>1</span>}
                      {p.result === 'draw'   && <span className={styles.pResult} style={{color:'rgba(255,255,255,0.4)'}}>½</span>}
                      {!p.result && p.black_user_id && <span className={styles.pResult} style={{color:'rgba(255,255,255,0.2)'}}>–</span>}
                      {p.result === 'black'  && <span className={styles.pResult} style={{color:'rgba(255,255,255,0.3)'}}>0</span>}
                      <span className={styles.pVs}>vs</span>
                      {p.result === 'black'  && <span className={styles.pResult} style={{color:'#6fdc8c'}}>1</span>}
                      {p.result === 'draw'   && <span className={styles.pResult} style={{color:'rgba(255,255,255,0.4)'}}>½</span>}
                      {!p.result && p.black_user_id && <span className={styles.pResult} style={{color:'rgba(255,255,255,0.2)'}}>–</span>}
                      {p.result === 'white'  && <span className={styles.pResult} style={{color:'rgba(255,255,255,0.3)'}}>0</span>}
                      {p.black_user_id
                        ? <span className={`${styles.pColor} ${styles.pBlack}`}><span style={{display:'inline-block',width:10,height:10,background:'#222',borderRadius:2,border:'1px solid #555'}}/></span>
                        : null
                      }
                      <span className={styles.pName}>{black ? black.username : (p.black_user_id ? '?' : '— bye')}</span>
                      {p.result && !canEdit && (
                        <span className={styles.pResultFinal}>
                          {p.result === 'white' ? '1-0' : p.result === 'black' ? '0-1' : p.result === 'draw' ? '½-½' : p.result}
                        </span>
                      )}
                      {canEdit && (
                        <div className={styles.pActions}>
                          <button className={styles.pBtn} onClick={() => handleResult(p.id, 'white')} disabled={acting}>1-0</button>
                          <button className={styles.pBtn} onClick={() => handleResult(p.id, 'draw')}  disabled={acting}>½-½</button>
                          <button className={styles.pBtn} onClick={() => handleResult(p.id, 'black')} disabled={acting}>0-1</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}
