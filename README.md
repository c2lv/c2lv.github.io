# C2LV — Life Archive

삶의 주요 사건을 시대순으로 따라가는 개인 아카이브. [Astro](https://astro.build)로 만들고 GitHub Pages로 배포한다.

## 개발

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ 에 정적 사이트 생성
```

## 배포

`master`에 push하면 `.github/workflows/deploy.yml`이 빌드 후 GitHub Pages에 배포한다.
레포 Settings → Pages → Source를 **GitHub Actions**로 설정해야 한다.
