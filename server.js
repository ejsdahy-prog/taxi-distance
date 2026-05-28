const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// 네이버 API 키
const CLIENT_ID = "gxa4fpctx9";
const CLIENT_SECRET = "3WDhALbTtt5Y95pYYPXLvrcBrg9xLExSrgjB0eYv";

// 거리 계산 API
app.get("/distance", async (req, res) => {

  const start = req.query.start;
  const goal = req.query.goal;

  try {

    // 출발지 좌표 검색
    const startGeo = await axios.get(
      "https://maps.apigw.ntruss.com/map-geocode/v2/geocode",
      {
        params: {
          query: start
        },
        headers: {
          "x-ncp-apigw-api-key-id": CLIENT_ID,
          "x-ncp-apigw-api-key": CLIENT_SECRET
        }
      }
    );

    // 도착지 좌표 검색
    const goalGeo = await axios.get(
      "https://maps.apigw.ntruss.com/map-geocode/v2/geocode",
      {
        params: {
          query: goal
        },
        headers: {
          "x-ncp-apigw-api-key-id": CLIENT_ID,
          "x-ncp-apigw-api-key": CLIENT_SECRET
        }
      }
    );

    // 주소 검색 실패
    if (
      startGeo.data.addresses.length === 0 ||
      goalGeo.data.addresses.length === 0
    ) {
      return res.status(400).json({
        error: "주소를 찾을 수 없습니다."
      });
    }

    // 좌표 추출
    const startX = startGeo.data.addresses[0].x;
    const startY = startGeo.data.addresses[0].y;

    const goalX = goalGeo.data.addresses[0].x;
    const goalY = goalGeo.data.addresses[0].y;

    // 길찾기 API
    const route = await axios.get(
      "https://maps.apigw.ntruss.com/map-direction/v1/driving",
      {
        params: {
          start: `${startX},${startY}`,
          goal: `${goalX},${goalY}`
        },
        headers: {
          "X-NCP-APIGW-API-KEY-ID": CLIENT_ID,
          "X-NCP-APIGW-API-KEY": CLIENT_SECRET
        }
      }
    );

    const summary = route.data.route.traoptimal[0].summary;

    const distance = (summary.distance / 1000).toFixed(1);
    const duration = Math.round(summary.duration / 60000);
    const toll = summary.tollFare;

    // 예상 택시비
    const price = Math.round(distance * 1500);

    res.json({
      distance,
      duration,
      toll,
      price
    });

  } catch (error) {

    console.log(error.response?.data || error);

    res.status(500).json({
      error: "거리 계산 실패"
    });

  }

});

// 서버 실행
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("서버 실행중");
});