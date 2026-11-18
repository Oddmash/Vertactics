import { description, editorUrl, landingUrl, siteUrl, socialImage } from './site';
import TerrainPreview from './terrain-preview';

const assets = editorUrl + 'product/';

const application = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Vertactics',
  description,
  url: landingUrl.href,
  image: socialImage.href,
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'Any',
  inLanguage: 'ko',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD' },
  potentialAction: { '@type': 'ViewAction', target: siteUrl.href },
};

const LandingPage = () => (
  <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{
      __html: JSON.stringify(application).replace(/</g, '\\u003c'),
    }} />
    <a className="skip" href="#main">본문 바로가기</a>
    <header className="site-header shell">
      <a className="brand" href="./" aria-label="Vertactics 소개">
        <img src={editorUrl + 'favicon.png'} width={32} height={32} alt="" />
        Vertactics
      </a>
      <nav aria-label="소개 페이지">
        <a href="#workflow">전술 설계</a>
        <a href="#maps">지원 전장</a>
      </nav>
      <a className="header-action" href={editorUrl}>편집기 열기 <span className="external-arrow" aria-hidden="true" /></a>
    </header>
    <main id="main">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-layout shell">
          <div className="hero-copy">
            <p className="product-category">오버워치 전술 플래너</p>
            <h1 id="hero-title">높이를 읽고,<br /><em>진입을 설계하다.</em></h1>
            <p className="hero-description">같은 전장을 2D와 3D로 살펴보세요. 어느 고지대에서 시야가 열리는지 확인하고, 영웅 배치와 진입 순서를 팀과 공유하세요.</p>
            <div className="hero-actions">
              <a className="primary-action" href={editorUrl} aria-label="전술 편집기 열기 / Open map editor">
                전술 편집기 열기 <span className="external-arrow" aria-hidden="true" />
              </a>
              <a className="text-action" href="#workflow">사용 흐름 보기 <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <TerrainPreview assetRoot={assets} />
        </div>
      </section>
      <section className="workflow shell" id="workflow" aria-labelledby="workflow-title">
        <div className="section-heading">
          <h2 id="workflow-title">전장을 읽고, 팀의 움직임을 짜세요.</h2>
          <p>고지대를 잡을 위치부터 진입 타이밍까지 한 전술 지도에서 정할 수 있습니다.</p>
        </div>
        <div className="workflow-grid">
          <article className="workflow-feature">
            <div className="feature-copy">
              <h3>고지대와 시야를 확인하세요.</h3>
              <p>2D에서 진입로를 살펴보고, 3D로 바꿔 계단과 높이 차를 확인하세요. 두 지점 사이에 시야를 가리는 지형이 있는지도 확인할 수 있습니다.</p>
            </div>
            <img src={assets + 'editor-sightline.webp'} alt="왕의 길 광장에서 두 지점 사이의 시야가 동상에 가려지는 2D 편집 화면" width={1440} height={900} loading="lazy" />
          </article>
          <article className="workflow-feature">
            <div className="feature-copy">
              <h3>영웅을 배치하고 경로를 그리세요.</h3>
              <p>공격팀과 수비팀의 위치를 정한 뒤 웨이포인트로 이동 경로를 그리세요. 영웅을 선택하면 스킬 설명과 검증된 수치를 확인할 수 있습니다.</p>
            </div>
            <img src={assets + 'editor-route.webp'} alt="왕의 길 정면 아치를 통과하는 세 지점의 이동 경로와 배치한 영웅이 보이는 3D 편집 화면" width={1440} height={900} loading="lazy" />
          </article>
          <article className="workflow-feature">
            <div className="feature-copy">
              <h3>진입 순서를 기록하고 공유하세요.</h3>
              <p>단계별 영웅 위치와 스킬 사용 타이밍을 기록하세요. 팀원은 읽기 전용 링크에서 전술을 보고 타임라인을 재생할 수 있습니다.</p>
            </div>
            <img src={assets + 'editor-playback.webp'} alt="왕의 길 고지대에 영웅이 배치된 읽기 전용 3D 전장과 상단 재생 컨트롤" width={1440} height={900} loading="lazy" />
          </article>
        </div>
      </section>
      <section className="map-scope" id="maps" aria-labelledby="maps-title">
        <div className="map-layout shell">
          <div className="section-heading">
            <h2 id="maps-title">지금 열 수 있는 지도</h2>
            <p>카탈로그에는 OWKR 내전 전장 31개가 있습니다. 편집 가능한 지형이 준비 중인 전장은 모드별 목록에서 상태를 확인할 수 있습니다.</p>
          </div>
          <dl className="map-list">
            <div><dt>왕의 길 A 거점 근사 지도</dt><dd>A 거점 주변 진입로와 엄폐물을 단순화한 지도</dd></div>
          </dl>
        </div>
      </section>
    </main>
    <footer className="site-footer shell">
      <p>Vertactics는 Blizzard Entertainment와 제휴하지 않은 독립 오버워치 팬 프로젝트입니다. 영웅 이미지 © Blizzard Entertainment.</p>
      <a href="https://github.com/qtaghdi/Vertactics">GitHub <span className="external-arrow" aria-hidden="true" /></a>
    </footer>
  </>
);

export default LandingPage;
