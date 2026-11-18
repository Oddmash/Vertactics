import { description, editorUrl, landingUrl, siteUrl, socialImage } from './site';

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
          <a href="#workflow">사용 방법</a>
          <a href="#maps">지원 전장</a>
        </nav>
        <a className="header-action" href={editorUrl}>편집기 열기 <span aria-hidden="true">↗</span></a>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy shell">
            <p className="product-category">오버워치 전술 플래너</p>
            <h1 id="hero-title">다음 교전을<br />지도 위에서 준비하세요.</h1>
            <p className="hero-description">누가 고지대를 잡고, 어디서 진입할지. 영웅을 지도에 놓고 이동 경로와 진입 타이밍을 정해 팀원에게 보여주세요.</p>
            <a className="primary-action" href={editorUrl} aria-label="전술 편집기 열기 / Open map editor">
              전술 편집기 열기 <span aria-hidden="true">↗</span>
            </a>
          </div>
          <figure className="hero-map">
            <img src={editorUrl + 'product/editor-2d.png'} alt="좌측 전략 도구, 중앙 2D 지도, 우측 영웅 선택이 보이는 Vertactics 편집기" width={1440} height={900} fetchPriority="high" />
            <figcaption>실제 편집기 · 2D 전술 보기</figcaption>
          </figure>
        </section>
        <section className="workflow shell" id="workflow" aria-labelledby="workflow-title">
          <h2 id="workflow-title">전술은 이렇게 만드세요.</h2>
          <ol className="workflow-list">
            <li>
              <h3>진입로와 고지대를 확인하세요.</h3>
              <p>2D에서 경로와 엄폐물의 위치를 살펴보고, 3D로 전환해 계단과 고지대의 높이를 확인하세요. 지형을 선택하면 높이를 볼 수 있습니다. 전체 화면을 켜면 지도와 편집 도구를 함께 화면 가득 펼쳐 볼 수 있습니다.</p>
              <img src={editorUrl + 'product/editor-elevation.png'} alt="계단과 고지대를 입체적으로 표시한 3D 편집 화면" width={1440} height={900} loading="lazy" />
            </li>
            <li>
              <h3>영웅을 놓고 교전 위치를 비교하세요.</h3>
              <p>영웅을 공격팀이나 수비팀에 배치하고, 웨이포인트로 이동 경로를 만들고, 두 점을 선택해 직선을 긋거나 펜으로 자유롭게 표시하세요. 거리·높이 차를 재거나, 두 지점 사이 시야를 어느 지형이 가리는지 확인할 수 있습니다. 영웅을 선택하면 스킬 설명과 출처가 확인된 수치를 볼 수 있습니다.</p>
              <img src={editorUrl + 'product/editor-markers.png'} alt="전장 위에 원과 선 마커를 표시한 편집 화면" width={1440} height={900} loading="lazy" />
            </li>
            <li>
              <h3>진입 순서를 기록하고 공유하세요.</h3>
              <p>타임라인에 단계별 영웅 위치와 능력 사용을 기록하세요. 팀원은 읽기 전용 링크에서 지도를 보고 타임라인을 재생할 수 있습니다. 작업은 같은 브라우저에 저장하거나 JSON으로 내보낼 수 있습니다.</p>
              <img src={editorUrl + 'product/editor-route.png'} alt="웨이포인트와 이동 경로가 보이는 편집 화면" width={1440} height={900} loading="lazy" />
            </li>
          </ol>
        </section>
        <section className="map-scope shell" id="maps" aria-labelledby="maps-title">
          <h2 id="maps-title">지금 열 수 있는 지도</h2>
          <div>
            <p>직접 설계한 <strong>조수 중계소</strong>에서 지상 교량, 하층 배수로와 상층 정비 교량을 활용한 전술을 설계할 수 있습니다. 가상 훈련 지도와 <strong>왕의 길 A 거점 근사 지도</strong>도 열 수 있습니다. 전장 카탈로그에는 OWKR 내전 전장 31개가 있으며 지형이 준비되지 않은 전장은 준비 중으로 표시합니다.</p>
          </div>
        </section>
      </main>
      <footer className="site-footer shell">
        <p>Vertactics는 Blizzard Entertainment와 제휴하지 않은 독립 오버워치 팬 프로젝트입니다. 영웅 이미지 © Blizzard Entertainment.</p>
        <a href="https://github.com/qtaghdi/Vertactics">GitHub <span aria-hidden="true">↗</span></a>
      </footer>
  </>
);

export default LandingPage;
