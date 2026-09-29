// src/pages/Rules.tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function Rules() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'bolao' | 'album' | 'simulador'>('bolao');

  return (
    <div className="section active">
      <div className="sec-title">{t('rules.title')}</div>
      
      <div className="admin-subtabs">
        <button className={`admin-subtab ${activeTab === 'bolao' ? 'active' : ''}`} onClick={() => setActiveTab('bolao')}>
          {t('rules.tabBolao')}
        </button>
        <button className={`admin-subtab ${activeTab === 'album' ? 'active' : ''}`} onClick={() => setActiveTab('album')}>
          {t('rules.tabAlbum')}
        </button>
        <button className={`admin-subtab ${activeTab === 'simulador' ? 'active' : ''}`} onClick={() => setActiveTab('simulador')}>
          {t('rules.tabSimulador')}
        </button>
      </div>

      {/* --- ABA: REGRAS DO BOLÃO --- */}
      {activeTab === 'bolao' && (
        <div id="regras-bolao-content">
          <div className="card">
            <div className="card-title">{t('rules.bolao.title1')}</div>
            <div className="ranking-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('rules.headers.crit')}</th>
                    <th>{t('rules.headers.pts')}</th>
                    <th>{t('rules.headers.ex')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>{t('rules.bolao.critExact')}</strong> <br/>{t('rules.bolao.critExactDesc')}</td>
                    <td><span className="badge badge-10">10 pontos</span></td>
                    <td>{t('rules.bolao.exExact')}</td>
                  </tr>
                  <tr>
                    <td><strong>{t('rules.bolao.critTrend')}</strong> <br/>{t('rules.bolao.critTrendDesc')}</td>
                    <td><span className="badge badge-5">5 pontos</span></td>
                    <td>{t('rules.bolao.exTrend')}</td>
                  </tr>
                  <tr>
                    <td><strong>{t('rules.bolao.critWinner')}</strong></td>
                    <td><span className="badge badge-3">3 pontos</span></td>
                    <td>{t('rules.bolao.exWinner')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="rules-alert" dangerouslySetInnerHTML={{ __html: t('rules.bolao.tiebreaker') }} style={{ borderLeft: '3px solid #f59e0b' }}/>
          </div>

          <div className="card">
            <div className="card-title">{t('rules.bolao.title2')}</div>
            <ul className="regras-list">
              <li dangerouslySetInnerHTML={{ __html: t('rules.bolao.step1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.bolao.step2') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.bolao.step3') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.bolao.step4') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.bolao.step5') }} />
            </ul>
          </div>
        </div>
      )}

      {/* --- ABA: REGRAS DO ÁLBUM --- */}
      {activeTab === 'album' && (
        <div id="regras-album-content">
          <div className="card">
            <div className="card-title">{t('rules.album.title1')}</div>
            <p style={{ fontSize: '0.9rem', marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: t('rules.album.desc1') }} />
            <div className="ranking-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{t('rules.headers.hit')}</th>
                    <th>{t('rules.headers.pack')}</th>
                    <th>{t('rules.headers.chance')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R1C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R1C2') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R1C3') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R2C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R2C2') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R2C3') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R3C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R3C2') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R3C3') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R4C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R4C2') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R4C3') }} /></tr>
                  <tr style={{ background: 'rgba(168,85,247,0.08)' }}><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R5C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R5C2') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R5C3') }} /></tr>
                  <tr style={{ background: 'rgba(168,85,247,0.05)' }}><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R6C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R6C2') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.packT1R6C3') }} /></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-title">{t('rules.album.title2')}</div>
            <ul className="regras-list">
              <li dangerouslySetInnerHTML={{ __html: t('rules.album.sp1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.album.sp2') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.album.sp3') }} />
            </ul>
          </div>

          <div className="card">
            <div className="card-title">{t('rules.album.title3')}</div>
            <ul className="regras-list">
              <li dangerouslySetInnerHTML={{ __html: t('rules.album.tr1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.album.tr2') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.album.tr3') }} />
            </ul>
          </div>

          <div className="card">
            <div className="card-title">{t('rules.album.title4')}</div>
            <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>{t('rules.album.desc4')}</p>
            <div className="ranking-wrap">
              <table>
                <thead><tr><th>{t('rules.headers.sac')}</th><th>{t('rules.headers.res')}</th></tr></thead>
                <tbody>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.album.syn1C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.syn1C2') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.album.syn2C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.syn2C2') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.album.syn3C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.syn3C2') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.album.syn4C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.syn4C2') }} /></tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '10px', padding: '10px', background: 'rgba(6,182,212,0.08)', borderLeft: '3px solid #06b6d4', borderRadius: '4px' }} dangerouslySetInnerHTML={{ __html: t('rules.album.synCat') }} />
          </div>

          <div className="card" style={{ borderLeft: '3px solid var(--legacy-sepia)' }}>
            <div className="card-title">{t('rules.album.title5')}</div>
            <p style={{ fontSize: '0.9rem', marginBottom: '12px' }} dangerouslySetInnerHTML={{ __html: t('rules.album.desc5') }} />
            <ul className="regras-list">
              <li dangerouslySetInnerHTML={{ __html: t('rules.album.leg1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.album.leg2') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.album.leg3') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.album.leg4') }} />
            </ul>
          </div>

          <div className="card" style={{ borderLeft: '3px solid #f59e0b' }}>
            <div className="card-title">{t('rules.album.title6')}</div>
            <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>{t('rules.album.desc6')}</p>
            <div className="ranking-wrap">
              <table>
                <thead><tr><th>{t('rules.headers.sac')}</th><th>{t('rules.headers.res')}</th></tr></thead>
                <tbody>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.album.for1C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.for1C2') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.album.for2C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.for2C2') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.album.for3C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.for3C2') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.album.for4C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.album.for4C2') }} /></tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '10px', padding: '10px', background: 'rgba(239,68,68,0.08)', borderLeft: '3px solid #ef4444', borderRadius: '4px' }} dangerouslySetInnerHTML={{ __html: t('rules.album.forRisk') }} />
          </div>
        </div>
      )}

      {/* --- ABA: REGRAS DO SIMULADOR --- */}
      {activeTab === 'simulador' && (
        <div id="regras-simulador-content">
          <div className="card">
            <div className="card-title">{t('rules.simulador.title1')}</div>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: t('rules.simulador.desc1') }} />
          </div>

          <div className="card">
            <div className="card-title">{t('rules.simulador.title2')}</div>
            <ul className="regras-list">
              <li dangerouslySetInnerHTML={{ __html: t('rules.simulador.step1') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.simulador.step2') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.simulador.step3') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.simulador.step4') }} />
              <li dangerouslySetInnerHTML={{ __html: t('rules.simulador.step5') }} />
            </ul>
          </div>

          <div className="card">
            <div className="card-title">{t('rules.simulador.title3')}</div>
            <div className="ranking-wrap">
              <table>
                <thead><tr><th>{t('rules.headers.hit')}</th><th>{t('rules.headers.pts')}</th></tr></thead>
                <tbody>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.pts1C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.pts1C2') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.pts2C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.pts2C2') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.pts3C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.pts3C2') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.pts4C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.pts4C2') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.pts5C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.pts5C2') }} /></tr>
                  <tr style={{ background: 'rgba(168,85,247,0.08)' }}><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.pts6C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.pts6C2') }} /></tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '10px', color: 'var(--muted)' }} dangerouslySetInnerHTML={{ __html: t('rules.simulador.desc3') }} />
          </div>

          <div className="card">
            <div className="card-title">{t('rules.simulador.title4')}</div>
            <p style={{ fontSize: '0.9rem', marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: t('rules.simulador.desc4') }} />
            <div className="ranking-wrap">
              <table>
                <thead><tr><th>{t('rules.headers.accPts')}</th><th>{t('rules.headers.prize')}</th></tr></thead>
                <tbody>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.prz1C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.prz1C2') }} /></tr>
                  <tr><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.prz2C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.prz2C2') }} /></tr>
                  <tr style={{ background: 'rgba(168,85,247,0.08)' }}><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.prz3C1') }} /><td dangerouslySetInnerHTML={{ __html: t('rules.simulador.prz3C2') }} /></tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: '0.85rem', marginTop: '8px', color: 'var(--muted)' }} dangerouslySetInnerHTML={{ __html: t('rules.simulador.desc4b') }} />
          </div>
        </div>
      )}
    </div>
  );
}