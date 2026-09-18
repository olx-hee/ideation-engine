/* mock.js — 백엔드 없이 화면을 돌리기 위한 가짜 서버 (config.js useMock=true 일 때만 사용)
   · data: API id별 예시 응답 = 각 화면 README의 "응답" 예시와 같음
   · overrides: 입력에 따라 결과가 달라지는 API 흉내 */
window.IE_MOCK = (function () {
  const data = {
    "auth.signup": {
      "user": {
        "id": "usr_001",
        "email": "hyeongwon@example.com",
        "nickname": "노형원",
        "avatarUrl": null,
        "plan": "FREE"
      },
      "accessToken": "eyJhbGciOi...",
      "expiresIn": 3600
    },
    "auth.login": {
      "user": {
        "id": "usr_001",
        "email": "hyeongwon@example.com",
        "nickname": "노형원",
        "avatarUrl": null,
        "plan": "FREE"
      },
      "accessToken": "eyJhbGciOi...",
      "expiresIn": 3600
    },
    "auth.refresh": {
      "user": {
        "id": "usr_001",
        "email": "hyeongwon@example.com",
        "nickname": "노형원",
        "avatarUrl": null,
        "plan": "FREE"
      },
      "accessToken": "eyJhbGciOi...",
      "expiresIn": 3600
    },
    "auth.oauth": {
      "user": {
        "id": "usr_001",
        "email": "hyeongwon@example.com",
        "nickname": "노형원",
        "avatarUrl": null,
        "plan": "FREE"
      },
      "accessToken": "eyJhbGciOi...",
      "isNewUser": false
    },
    "auth.logout": null,
    "auth.passwordReset": {
      "sent": true
    },
    "auth.me": {
      "user": {
        "id": "usr_001",
        "email": "hyeongwon@example.com",
        "nickname": "노형원",
        "avatarUrl": null,
        "plan": "FREE"
      },
      "profileComplete": true,
      "profileSummary": {
        "desiredRole": "개발·구현",
        "skills": [
          "프론트엔드",
          "백엔드",
          "발표·피칭"
        ]
      },
      "sessionCount": 6,
      "activeSession": {
        "sessionId": "ses_7K2X9",
        "code": "7K2X9M",
        "topic": "교내 해커톤에서 만들 서비스 아이디어 정하기",
        "role": "host",
        "status": "running",
        "stage": {
          "id": "diverge.vote",
          "label": "아이디어 발산",
          "subStep": 5,
          "progress": 55
        }
      }
    },
    "legal.get": {
      "type": "terms",
      "version": "2026-09-01",
      "title": "이용약관",
      "html": "<h5>제1조 (목적)</h5><p>…</p>"
    },
    "meta.skills": {
      "roles": [
        "자료조사",
        "발표·기획",
        "문서정리",
        "개발·구현",
        "디자인"
      ],
      "skillGroups": [
        {
          "id": "dev",
          "title": "개발",
          "hint": null,
          "skills": [
            "프론트엔드",
            "백엔드",
            "데이터",
            "인프라",
            "AI/ML"
          ]
        },
        {
          "id": "design",
          "title": "디자인",
          "hint": "만드는 결과물 기준",
          "skills": [
            "PPT 디자인",
            "웹 디자인",
            "앱 디자인",
            "영상·모션",
            "브랜딩·그래픽"
          ]
        },
        {
          "id": "plan",
          "title": "기획",
          "hint": "무엇을 설계하는 기획인지 기준",
          "skills": [
            "비즈니스 모델 기획",
            "기술 설계 기획",
            "서비스 기획",
            "프로젝트 관리",
            "사업계획서·제안서"
          ]
        },
        {
          "id": "etc",
          "title": "발표·기타",
          "hint": null,
          "skills": [
            "발표·피칭",
            "마케팅·홍보",
            "리서치·사용자 조사",
            "문서 정리",
            "논문"
          ]
        }
      ]
    },
    "profile.get": {
      "nickname": "노형원",
      "strength": "발표 자료를 빠르게 잘 만들어요",
      "desiredRole": "개발·구현",
      "skills": [
        "프론트엔드",
        "백엔드",
        "PPT 디자인",
        "기술 설계 기획",
        "발표·피칭"
      ],
      "avatarUrl": null,
      "updatedAt": "2026-09-12T10:20:00+09:00"
    },
    "profile.update": {
      "nickname": "노형원",
      "strength": "발표 자료를 빠르게 잘 만들어요",
      "desiredRole": "개발·구현",
      "skills": [
        "프론트엔드",
        "백엔드",
        "PPT 디자인",
        "기술 설계 기획",
        "발표·피칭"
      ],
      "avatarUrl": null,
      "updatedAt": "2026-09-12T10:20:00+09:00"
    },
    "profile.avatarUpload": {
      "avatarUrl": "https://cdn.ideationengine.app/avatars/usr_001.webp"
    },
    "profile.avatarDelete": null,
    "history.list": {
      "counts": {
        "all": 6,
        "host": 3,
        "participant": 3
      },
      "items": [
        {
          "sessionId": "ses_7K2X9",
          "date": "2026-09-15",
          "topic": "교내 해커톤에서 만들 서비스 아이디어",
          "myRole": "host",
          "memberCount": 4,
          "durationMin": 30,
          "decidedTopic": "첫 회의 돕기",
          "reportAvailable": true
        },
        {
          "sessionId": "ses_Q8M21",
          "date": "2026-08-27",
          "topic": "동아리 홍보 영상 기획",
          "myRole": "participant",
          "memberCount": 6,
          "durationMin": 17,
          "decidedTopic": null,
          "endedEarly": true,
          "reportAvailable": false
        }
      ],
      "nextCursor": null
    },
    "settings.get": {
      "email": "hyeongwon@example.com",
      "passwordChangedAt": "2026-06-10T09:00:00+09:00",
      "connections": {
        "google": true,
        "kakao": false
      },
      "notifications": {
        "sessionInvite": true,
        "reportReady": true,
        "marketing": false
      }
    },
    "settings.update": {
      "email": "hyeongwon@example.com",
      "passwordChangedAt": "2026-06-10T09:00:00+09:00",
      "connections": {
        "google": true,
        "kakao": false
      },
      "notifications": {
        "sessionInvite": true,
        "reportReady": true,
        "marketing": false
      }
    },
    "account.changeEmail": {
      "verificationSent": true
    },
    "account.changePassword": null,
    "account.connect": {
      "connections": {
        "google": true,
        "kakao": true
      }
    },
    "account.disconnect": null,
    "account.withdraw": null,
    "billing.plan": {
      "plan": "FREE",
      "limits": {
        "maxSessionMinutes": 30,
        "unlimitedDuration": false
      },
      "pro": {
        "priceLabel": "가격 미정",
        "features": [
          "30분 넘는 세션 (60분 · 90분 · 제한 없음)"
        ]
      }
    },
    "billing.checkout": {
      "checkoutUrl": "https://pg.example.com/checkout/abc"
    },
    "session.create": {
      "sessionId": "ses_7K2X9",
      "code": "7K2X9M",
      "inviteUrl": "https://ideationengine.app/s/7K2X9M",
      "topic": "교내 해커톤에서 만들 서비스 아이디어 정하기",
      "criteria": null,
      "durationMin": 30,
      "maxMembers": 4,
      "status": "lobby",
      "stage": {
        "id": "lobby",
        "label": "대기실",
        "subStep": null,
        "progress": 0
      },
      "timer": {
        "endsAt": null,
        "remainingSec": null
      },
      "host": {
        "participantId": "par_01",
        "nickname": "노형원"
      },
      "me": {
        "participantId": "par_01",
        "role": "host",
        "isLeader": false
      },
      "memberCount": 3
    },
    "session.lookup": {
      "sessionId": "ses_7K2X9",
      "code": "7K2X9M",
      "topic": "교내 해커톤에서 만들 서비스 아이디어 정하기",
      "hostNickname": "노형원",
      "memberCount": 3,
      "maxMembers": 4,
      "status": "lobby",
      "alreadyJoined": false,
      "myRole": null
    },
    "session.join": {
      "participantId": "par_02",
      "role": "participant",
      "rejoined": false,
      "session": {
        "status": "lobby",
        "stage": {
          "id": "lobby",
          "label": "대기실",
          "subStep": null,
          "progress": 0
        }
      }
    },
    "session.get": {
      "sessionId": "ses_7K2X9",
      "code": "7K2X9M",
      "inviteUrl": "https://ideationengine.app/s/7K2X9M",
      "topic": "교내 해커톤에서 만들 서비스 아이디어 정하기",
      "criteria": null,
      "durationMin": 30,
      "maxMembers": 4,
      "status": "running",
      "stage": {
        "id": "diverge.vote",
        "label": "아이디어 발산",
        "subStep": 5,
        "progress": 55
      },
      "timer": {
        "endsAt": "2026-09-18T15:32:10+09:00",
        "remainingSec": 130
      },
      "host": {
        "participantId": "par_01",
        "nickname": "노형원"
      },
      "me": {
        "participantId": "par_01",
        "role": "host",
        "isLeader": false
      },
      "memberCount": 3
    },
    "session.participants": {
      "maxMembers": 4,
      "items": [
        {
          "participantId": "par_01",
          "nickname": "노형원",
          "role": "host",
          "online": true,
          "isMe": true
        },
        {
          "participantId": "par_02",
          "nickname": "이세민",
          "role": "participant",
          "online": true
        },
        {
          "participantId": "par_03",
          "nickname": "김승희",
          "role": "participant",
          "online": true
        }
      ]
    },
    "session.kick": null,
    "session.start": {
      "status": "running",
      "stage": {
        "id": "icebreak",
        "label": "아이스브레이킹",
        "subStep": 1,
        "progress": 3
      },
      "timer": {
        "endsAt": "2026-09-18T15:30:00+09:00",
        "remainingSec": 1800
      }
    },
    "session.advance": {
      "stage": {
        "id": "diverge.write",
        "label": "아이디어 발산",
        "subStep": 1,
        "progress": 25
      }
    },
    "session.back": {
      "stage": {
        "id": "icebreak",
        "label": "아이스브레이킹",
        "subStep": 5,
        "progress": 18
      }
    },
    "session.extend": {
      "timer": {
        "endsAt": "2026-09-18T15:37:10+09:00",
        "remainingSec": 300
      }
    },
    "ice.state": {
      "step": 1,
      "done": false,
      "topics": [
        "최근 불편했던 순간",
        "요즘 이 주제 주변에서 바뀐 것",
        "그 변화와 내 경험",
        "요즘 쓰는 서비스와 아쉬운 점",
        "해보고 싶은 것 · 피하고 싶은 것"
      ],
      "messages": [
        {
          "id": "m1",
          "role": "ai",
          "label": null,
          "style": null,
          "text": "안녕하세요 노형원님. 저와 1:1로 짧게 이야기해요. …"
        },
        {
          "id": "m2",
          "role": "ai",
          "label": "질문 1 · 불편했던 순간",
          "style": null,
          "text": "최근 일주일, 가장 불편했던 순간은 언제였어요? 사소한 것도 좋아요."
        }
      ]
    },
    "ice.send": {
      "step": 1,
      "done": false,
      "messages": [
        {
          "id": "m4",
          "role": "ai",
          "label": "꼬리질문",
          "style": "fq",
          "text": "어떤 과제였고, 공지가 **어디에** 올라와 있었어요?"
        }
      ]
    },
    "ice.skip": {
      "step": 2,
      "done": false,
      "messages": [
        {
          "id": "m9",
          "role": "ai",
          "label": "질문 2 · 요즘 바뀐 것",
          "text": "요즘 '캠퍼스 생활 서비스' 주변 소식이에요. …"
        }
      ]
    },
    "ice.news": {
      "ready": true,
      "cards": [
        {
          "cardId": "news_1",
          "category": "시장",
          "title": "대학가 중고거래가 앱 밖 단톡방으로 이동",
          "plain": "거래는 늘었는데 믿을 장치가 없어요",
          "forTeam": "신뢰·정산을 돕는 도구가 틈새일 수 있어요",
          "source": {
            "name": "[기사·매체]",
            "url": "https://example.com/news/1",
            "publishedAt": "2026-09-10"
          },
          "myReaction": "heard"
        },
        {
          "cardId": "news_2",
          "category": "기술",
          "title": "폰 안에서 도는 온디바이스 AI 모델 무료 공개",
          "plain": "서버 없이도 요약 같은 AI 기능을 넣을 수 있어요",
          "forTeam": "백엔드가 약해도 AI 시연이 가능해요",
          "source": {
            "name": "[공식 블로그]",
            "url": "https://example.com/news/2",
            "publishedAt": "2026-09-08"
          },
          "myReaction": "new"
        },
        {
          "cardId": "news_3",
          "category": "규제",
          "title": "학생 개인정보 동의 절차 강화",
          "plain": "학번·시간표를 쓰면 동의 화면이 더 분명해야 해요",
          "forTeam": "학생 정보를 쓰면 동의 흐름도 기능이에요",
          "source": {
            "name": "[기관 보도자료]",
            "url": "https://example.com/news/3",
            "publishedAt": "2026-09-05"
          },
          "myReaction": null
        }
      ]
    },
    "ice.react": {
      "cardId": "news_2",
      "myReaction": "new"
    },
    "ice.explain": {
      "message": {
        "id": "m7",
        "role": "ai",
        "style": "explain",
        "text": "**온디바이스 AI**는 인터넷 서버를 거치지 않고 폰이나 노트북 안에서 바로 도는 AI예요. …"
      },
      "askedTerms": [
        "온디바이스 AI"
      ]
    },
    "ice.progress": {
      "items": [
        {
          "nickname": "노형원",
          "isMe": true,
          "step": 1,
          "done": false
        },
        {
          "nickname": "이세민",
          "step": 2,
          "done": false
        },
        {
          "nickname": "김승희",
          "step": 2,
          "done": false
        },
        {
          "nickname": "박상진",
          "step": 0,
          "done": false
        }
      ]
    },
    "ice.myMaterials": {
      "items": [
        {
          "text": "교양 과제 공지가 메일로만 와서 마감을 놓침",
          "avoid": false
        },
        {
          "text": "단톡방 공동구매가 늘며 정산을 한 사람이 떠안음",
          "avoid": false
        },
        {
          "text": "피그마 수정 내역 추적이 어렵고, 노션엔 팀원이 잘 안 들어옴",
          "avoid": false
        },
        {
          "text": "AI 기능을 직접 넣어보고 싶음",
          "avoid": false
        },
        {
          "text": "학교 앞 카페 콘센트 자리 경쟁",
          "avoid": false
        },
        {
          "text": "앱 개발",
          "avoid": true
        }
      ]
    },
    "ice.overview": {
      "progress": [
        {
          "nickname": "노형원",
          "step": 5,
          "done": true
        },
        {
          "nickname": "이세민",
          "step": 5,
          "done": true
        },
        {
          "nickname": "김승희",
          "step": 5,
          "done": true
        },
        {
          "nickname": "박상진",
          "step": 4,
          "done": false
        }
      ],
      "newsReactions": [
        {
          "cardId": "news_1",
          "category": "시장",
          "title": "단톡방 중고거래",
          "counts": {
            "new": 1,
            "heard": 2,
            "know": 1
          }
        },
        {
          "cardId": "news_2",
          "category": "기술",
          "title": "온디바이스 AI",
          "counts": {
            "new": 3,
            "heard": 0,
            "know": 1
          }
        },
        {
          "cardId": "news_3",
          "category": "규제",
          "title": "학생 정보 동의 강화",
          "counts": {
            "new": 4,
            "heard": 0,
            "know": 0
          }
        }
      ],
      "hint": "온디바이스 AI를 잘 아는 사람이 1명 있어요. 발산 때 설명을 부탁해 보세요.",
      "materialCount": 11,
      "groups": [
        {
          "groupId": "grp_1",
          "title": "흩어진 학교 정보",
          "desc": "묶으면 \"캠퍼스 정보를 한곳에서\" 방향이 돼요",
          "aiPick": true,
          "focus": true,
          "items": [
            {
              "text": "과제 공지가 메일·LMS·단톡으로 흩어짐",
              "count": 2,
              "avoid": false
            },
            {
              "text": "시험기간 열람실 빈자리 찾기",
              "count": 1,
              "avoid": false
            },
            {
              "text": "학교 앞 카페 콘센트 자리 경쟁",
              "count": 1,
              "avoid": false
            }
          ]
        },
        {
          "groupId": "grp_2",
          "title": "AI를 직접 써보고 싶음",
          "desc": "동기가 가장 많이 겹치고, 최근 소식과도 이어져요",
          "aiPick": false,
          "focus": true,
          "items": [
            {
              "text": "AI 기능을 직접 넣어보고 싶음",
              "count": 3,
              "avoid": false
            },
            {
              "text": "온디바이스 AI로 서버 없이 시연",
              "count": 1,
              "avoid": false
            }
          ]
        },
        {
          "groupId": "grp_3",
          "title": "돈·정산의 신뢰",
          "desc": "최근 시장 변화와 실제 경험이 맞닿아 있어요",
          "aiPick": false,
          "focus": false,
          "items": [
            {
              "text": "단톡방 공동구매 정산을 한 사람이 떠안음",
              "count": 1,
              "avoid": false
            }
          ]
        },
        {
          "groupId": "grp_4",
          "title": "우리 팀의 조건",
          "desc": "주제가 아니라 범위를 정하는 재료예요",
          "aiPick": false,
          "focus": null,
          "items": [
            {
              "text": "웹 화면과 발표 자료는 자신 있음",
              "count": 2,
              "avoid": false
            },
            {
              "text": "앱 개발 · 서버가 무거운 방향",
              "count": 2,
              "avoid": true
            }
          ]
        }
      ]
    },
    "ice.regroup": {
      "groups": [
        {
          "groupId": "grp_1",
          "title": "흩어진 학교 정보",
          "desc": "묶으면 \"캠퍼스 정보를 한곳에서\" 방향이 돼요",
          "aiPick": true,
          "focus": true,
          "items": [
            {
              "text": "과제 공지가 메일·LMS·단톡으로 흩어짐",
              "count": 2,
              "avoid": false
            },
            {
              "text": "시험기간 열람실 빈자리 찾기",
              "count": 1,
              "avoid": false
            },
            {
              "text": "학교 앞 카페 콘센트 자리 경쟁",
              "count": 1,
              "avoid": false
            }
          ]
        },
        {
          "groupId": "grp_2",
          "title": "AI를 직접 써보고 싶음",
          "desc": "동기가 가장 많이 겹치고, 최근 소식과도 이어져요",
          "aiPick": false,
          "focus": true,
          "items": [
            {
              "text": "AI 기능을 직접 넣어보고 싶음",
              "count": 3,
              "avoid": false
            },
            {
              "text": "온디바이스 AI로 서버 없이 시연",
              "count": 1,
              "avoid": false
            }
          ]
        },
        {
          "groupId": "grp_3",
          "title": "돈·정산의 신뢰",
          "desc": "최근 시장 변화와 실제 경험이 맞닿아 있어요",
          "aiPick": false,
          "focus": false,
          "items": [
            {
              "text": "단톡방 공동구매 정산을 한 사람이 떠안음",
              "count": 1,
              "avoid": false
            }
          ]
        },
        {
          "groupId": "grp_4",
          "title": "우리 팀의 조건",
          "desc": "주제가 아니라 범위를 정하는 재료예요",
          "aiPick": false,
          "focus": null,
          "items": [
            {
              "text": "웹 화면과 발표 자료는 자신 있음",
              "count": 2,
              "avoid": false
            },
            {
              "text": "앱 개발 · 서버가 무거운 방향",
              "count": 2,
              "avoid": true
            }
          ]
        }
      ]
    },
    "ice.focus": {
      "groupId": "grp_3",
      "focus": true
    },
    "ice.materials": {
      "total": 11,
      "focusGroups": [
        {
          "groupId": "grp_1",
          "title": "흩어진 학교 정보",
          "desc": "묶으면 \"캠퍼스 정보를 한곳에서\" 방향이 돼요",
          "aiPick": true,
          "focus": true,
          "items": [
            {
              "text": "과제 공지가 메일·LMS·단톡으로 흩어짐",
              "count": 2,
              "avoid": false
            },
            {
              "text": "시험기간 열람실 빈자리 찾기",
              "count": 1,
              "avoid": false
            },
            {
              "text": "학교 앞 카페 콘센트 자리 경쟁",
              "count": 1,
              "avoid": false
            }
          ]
        },
        {
          "groupId": "grp_2",
          "title": "AI를 직접 써보고 싶음",
          "desc": "동기가 가장 많이 겹치고, 최근 소식과도 이어져요",
          "aiPick": false,
          "focus": true,
          "items": [
            {
              "text": "AI 기능을 직접 넣어보고 싶음",
              "count": 3,
              "avoid": false
            },
            {
              "text": "온디바이스 AI로 서버 없이 시연",
              "count": 1,
              "avoid": false
            }
          ]
        }
      ],
      "otherGroups": [
        {
          "groupId": "grp_3",
          "title": "돈·정산의 신뢰",
          "desc": "최근 시장 변화와 실제 경험이 맞닿아 있어요",
          "aiPick": false,
          "focus": false,
          "items": [
            {
              "text": "단톡방 공동구매 정산을 한 사람이 떠안음",
              "count": 1,
              "avoid": false
            }
          ]
        },
        {
          "groupId": "grp_4",
          "title": "우리 팀의 조건",
          "desc": "주제가 아니라 범위를 정하는 재료예요",
          "aiPick": false,
          "focus": null,
          "items": [
            {
              "text": "웹 화면과 발표 자료는 자신 있음",
              "count": 2,
              "avoid": false
            },
            {
              "text": "앱 개발 · 서버가 무거운 방향",
              "count": 2,
              "avoid": true
            }
          ]
        }
      ]
    },
    "idea.mine": {
      "submitted": false,
      "ideas": [
        {
          "rank": 1,
          "text": "과제 공지와 마감을 메일·학교 사이트·단톡에서 한곳에 모아 알려주는 웹",
          "source": "own"
        },
        {
          "rank": 2,
          "text": "강의자료 PDF를 요약해 주는 브라우저 도구",
          "source": "own"
        }
      ]
    },
    "idea.submit": {
      "submitted": true,
      "submittedCount": 3,
      "memberCount": 4
    },
    "idea.recommend": {
      "items": [
        {
          "recommendationId": "rec_1",
          "title": "학교 행사·특강 소식 중 관심 있는 것만 골라 알려주는 웹",
          "reason": "\"중요한 공지를 자주 놓친다\"고 했어요"
        },
        {
          "recommendationId": "rec_2",
          "title": "중고 전공책을 같은 학과 안에서만 사고파는 게시판",
          "reason": "\"학기마다 책값이 부담\"이라고 했어요"
        },
        {
          "recommendationId": "rec_3",
          "title": "팀플 회비를 누가 냈는지 링크 하나로 확인하는 웹",
          "reason": "최근 소식 \"단톡방 거래 증가\"를 들어봤어요"
        },
        {
          "recommendationId": "rec_4",
          "title": "디자인 수정 요청을 한 화면에 모아 보는 팀플 도구",
          "reason": "\"피그마에서 누가 어디를 고쳤는지 모르겠다\"고 했어요"
        }
      ],
      "nextCursor": "rec_page_2"
    },
    "idea.board": {
      "submittedCount": 4,
      "memberCount": 4,
      "rows": [
        {
          "alias": "A",
          "isMe": false,
          "ideas": [
            {
              "ideaId": "ide_a1",
              "rank": 1,
              "text": "열람실·카페 빈자리를 함께 알려주는 지도"
            },
            {
              "ideaId": "ide_a2",
              "rank": 2,
              "text": "팀플 회의가 끝나면 할 일을 정리해 주는 서비스"
            },
            {
              "ideaId": "ide_a3",
              "rank": 3,
              "text": "내 필기로 시험 예상 문제를 만들어 주는 웹"
            }
          ]
        },
        {
          "alias": "C",
          "isMe": true,
          "ideas": [
            {
              "ideaId": "ide_c1",
              "rank": 1,
              "text": "과제 공지와 마감을 한곳에 모아 알려주는 웹"
            }
          ]
        }
      ]
    },
    "comment.targets": {
      "quota": {
        "concernDone": 4,
        "concernTotal": 9,
        "praiseUsed": 1,
        "praiseMax": 2
      },
      "groups": [
        {
          "alias": "A",
          "items": [
            {
              "ideaId": "ide_a1",
              "rank": 1,
              "title": "열람실·카페 빈자리 지도",
              "status": "done",
              "praised": true
            }
          ]
        },
        {
          "alias": "B",
          "items": [
            {
              "ideaId": "ide_b1",
              "rank": 1,
              "title": "관심 있는 학교 소식만 골라 알려주는 웹",
              "status": "todo"
            }
          ]
        }
      ]
    },
    "comment.list": {
      "idea": {
        "ideaId": "ide_b1",
        "alias": "B",
        "rank": 1,
        "text": "학교 행사·특강 소식 중 관심 있는 것만 골라 알려주는 웹"
      },
      "counts": {
        "concern": 2,
        "praise": 1
      },
      "items": [
        {
          "type": "concern",
          "text": "관심사를 처음에 고르는 게 귀찮을 수 있어요. 고르지 않아도 일단 보이게 하면 좋겠어요"
        },
        {
          "type": "concern",
          "text": "에브리타임 공지 게시판과 겹칠 수 있어요"
        },
        {
          "type": "praise",
          "text": "공지를 따로 찾아다닐 필요가 없어져요"
        }
      ],
      "mine": null
    },
    "comment.create": {
      "saved": true,
      "quota": {
        "concernDone": 5,
        "concernTotal": 9,
        "praiseUsed": 1,
        "praiseMax": 2
      }
    },
    "review.list": {
      "ready": true,
      "total": 12,
      "doneCount": 12,
      "groups": [
        {
          "grade": "go",
          "label": "바로 해볼 만해요",
          "items": [
            {
              "ideaId": "ide_c1",
              "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹"
            }
          ]
        },
        {
          "grade": "fix",
          "label": "보완하면 좋아요",
          "items": [
            {
              "ideaId": "ide_a1",
              "title": "열람실·카페 빈자리 지도"
            }
          ]
        },
        {
          "grade": "re",
          "label": "다시 생각해 봐요",
          "items": [
            {
              "ideaId": "ide_c2",
              "title": "강의자료 PDF 요약 도구"
            }
          ]
        }
      ]
    },
    "review.get": {
      "ideaId": "ide_c1",
      "alias": "C",
      "rank": 1,
      "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹",
      "status": "done",
      "grade": "go",
      "exists": {
        "label": "비슷한 게 있음",
        "summary": "일정 관리 앱은 많지만, 여러 곳의 학교 공지를 모아주는 건 드물어요.",
        "searchUrl": "https://search.example.com/?q=..."
      },
      "feasibility": {
        "level": "상",
        "summary": "웹 화면 2명 · 백엔드 1명이 있어요. 학교 사이트 자동 연결 대신 링크를 붙여넣는 방식이면 지금 수준으로 충분해요."
      },
      "missingSkills": {
        "count": 1,
        "summary": "메일·LMS 자동 연동(API) 경험 — 없어도 시연은 돼요."
      },
      "need": {
        "label": "있음",
        "summary": "인터뷰에서 2명이 공지를 놓쳐 마감을 넘긴 경험을 말했어요."
      },
      "timeline": {
        "label": "가능",
        "summary": "모으기·마감 알림만 하면 해커톤 기간 안에 시연할 수 있어요."
      },
      "commentSummary": {
        "concern": 3,
        "praise": 2,
        "concernPoints": [
          "학교마다 공지 사이트가 달라요",
          "알림이 많으면 귀찮아요"
        ],
        "praisePoints": [
          "다들 겪는 문제라 공감이 커요",
          "발표하기 쉬워요"
        ]
      }
    },
    "vote.state": {
      "maxVotes": 2,
      "myVotes": [
        "ide_c1"
      ],
      "votedCount": 3,
      "memberCount": 4,
      "finished": false,
      "candidates": [
        {
          "id": "ide_c1",
          "kind": "idea",
          "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹",
          "grade": "go",
          "isMine": true
        },
        {
          "id": "ide_b1",
          "kind": "idea",
          "title": "관심 있는 학교 행사·특강 소식만 골라 알려주는 웹",
          "grade": "go",
          "isMine": false
        },
        {
          "id": "ide_a2",
          "kind": "idea",
          "title": "팀플 회의가 끝나면 할 일을 정리해 주는 서비스",
          "grade": "go",
          "isMine": false
        }
      ],
      "aiIdeas": [
        {
          "id": "aii_1",
          "kind": "ai",
          "title": "시험기간에만 여는 열람실·카페 빈자리·콘센트 제보판",
          "grade": "go"
        },
        {
          "id": "aii_2",
          "kind": "ai",
          "title": "팀플 자료·수정 요청을 링크 하나에 모으고 바뀐 점만 요약",
          "grade": "fix"
        }
      ],
      "commonThreads": [
        {
          "id": "thr_1",
          "title": "\"누가 무엇을 했는지\"가 한곳에 안 남아요",
          "candidateCount": 4
        },
        {
          "id": "thr_2",
          "title": "알림이 너무 많아 중요한 걸 놓쳐요",
          "candidateCount": 2
        },
        {
          "id": "thr_3",
          "title": "AI는 넣고 싶지만 무거운 서버는 피하고 싶어요",
          "candidateCount": 2
        }
      ]
    },
    "vote.candidate": {
      "ideaId": "ide_a2",
      "alias": "A",
      "rank": 2,
      "title": "팀플 회의가 끝나면 할 일을 정리해 주는 서비스",
      "grade": "go",
      "originalText": "회의 메모나 녹음을 올리면 누가 언제까지 뭘 해야 하는지 정리해서 단톡방에 보내주는 서비스",
      "review": {
        "exists": {
          "label": "비슷한 게 있음",
          "summary": "회의록 AI는 많지만 대학 팀플·단톡 공유에 맞춘 건 드물어요.",
          "searchUrl": "https://search.example.com/?q=..."
        },
        "feasibility": {
          "level": "상",
          "summary": "텍스트 메모부터 시작하면 돼요."
        },
        "need": {
          "label": "있음",
          "summary": "인터뷰에서 3명이 비슷한 경험을 말했어요."
        },
        "timeline": {
          "label": "가능",
          "summary": "메모 입력과 할 일 정리 화면만 하면 시연할 수 있어요."
        }
      },
      "comments": {
        "concern": 3,
        "praise": 2,
        "items": [
          {
            "type": "concern",
            "text": "회의 메모를 누가 정리해서 올릴지가 또 문제예요"
          },
          {
            "type": "praise",
            "text": "팀플마다 겪는 문제라 발표할 때 공감을 얻기 쉬워요"
          }
        ]
      },
      "votedByMe": false
    },
    "vote.aiIdea": {
      "id": "aii_1",
      "title": "시험기간에만 여는 열람실·카페 빈자리·콘센트 제보판",
      "grade": "go",
      "sources": [
        {
          "alias": "A",
          "rank": 1,
          "title": "열람실·카페 빈자리를 함께 알려주는 지도",
          "grade": "fix",
          "takenPoint": "시험기간엔 누구나 겪는 문제라 공감이 커요"
        },
        {
          "alias": "D",
          "rank": 3,
          "title": "학교 앞 카페 콘센트 자리 알림",
          "grade": "re",
          "takenPoint": "콘센트 자리는 실제로 다들 찾아다녀요"
        }
      ],
      "fixes": [
        {
          "problem": "실시간 정보가 틀릴 수 있어요",
          "concernCount": 3,
          "fix": "제보 시간과 \"지금도 맞아요\" 확인 수를 같이 보여주기"
        },
        {
          "problem": "평소엔 쓸 일이 별로 없어요",
          "concernCount": 2,
          "fix": "시험기간 2주만 여는 서비스로 범위 줄이기"
        }
      ],
      "review": {
        "exists": "비슷한 게 있음",
        "feasibility": "상",
        "need": "있음",
        "timeline": "가능",
        "searchUrl": "https://search.example.com/?q=..."
      }
    },
    "vote.thread": {
      "id": "thr_1",
      "title": "팀플에서 \"누가 무엇을 했는지\"가 한곳에 남지 않아요",
      "answerCount": 3,
      "includesMine": true,
      "sources": [
        {
          "question": "질문 1 · 불편",
          "summary": "과제 공지가 메일·LMS·단톡으로 흩어져 마감을 놓침"
        },
        {
          "question": "질문 1 · 불편",
          "summary": "팀플 회비를 누가 냈는지 헷갈림"
        },
        {
          "question": "질문 4 · 쓰는 서비스",
          "summary": "피그마 수정 내역을 추적하기 어렵고, 노션엔 팀원이 잘 안 들어옴"
        }
      ],
      "why": "세 재료는 서로 다른 묶음(흩어진 학교 정보 · 돈·정산 · 팀의 조건)에 있었어요. 겉은 달라도 모두 \"기록이 한곳에 없다\"는 같은 문제예요.",
      "candidates": [
        {
          "id": "ide_c1",
          "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹",
          "grade": "go",
          "isMine": true,
          "votedByMe": true
        },
        {
          "id": "aii_2",
          "title": "팀플 자료·수정 요청을 링크 하나에 모으고 바뀐 점만 요약",
          "grade": "fix",
          "isAi": true,
          "votedByMe": false
        }
      ],
      "myReaction": "didntKnow"
    },
    "vote.threadReact": {
      "myReaction": "didntKnow"
    },
    "vote.save": {
      "myVotes": [
        "ide_c1",
        "ide_a2"
      ],
      "remaining": 0
    },
    "vote.finish": {
      "finished": true,
      "votedCount": 4,
      "memberCount": 4
    },
    "vote.results": {
      "totalVotes": 8,
      "memberCount": 4,
      "unvotedCount": 9,
      "ranks": [
        {
          "rank": 1,
          "id": "ide_c1",
          "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹",
          "grade": "go",
          "votes": 3,
          "owner": {
            "nickname": "노형원",
            "rank": 1
          }
        },
        {
          "rank": 2,
          "id": "ide_b1",
          "title": "관심 있는 학교 행사·특강 소식만 골라 알려주는 웹",
          "grade": "go",
          "votes": 2,
          "owner": {
            "nickname": "김승희",
            "rank": 1
          }
        },
        {
          "rank": 3,
          "id": "ide_a2",
          "title": "팀플 회의가 끝나면 할 일을 정리해 주는 서비스",
          "grade": "go",
          "votes": 1,
          "owner": {
            "nickname": "이세민",
            "rank": 2
          }
        },
        {
          "rank": 3,
          "id": "aii_1",
          "title": "시험기간에만 여는 열람실·카페 빈자리·콘센트 제보판",
          "grade": "go",
          "votes": 1,
          "aiMerged": true,
          "sourceOwners": [
            {
              "nickname": "이세민",
              "rank": 1
            },
            {
              "nickname": "박상진",
              "rank": 3
            }
          ]
        },
        {
          "rank": 3,
          "id": "ide_b2",
          "title": "중고 전공책을 같은 학과 안에서만 사고파는 게시판",
          "grade": "go",
          "votes": 1,
          "owner": {
            "nickname": "김승희",
            "rank": 2
          }
        }
      ],
      "ties": [
        {
          "rank": 3,
          "ids": [
            "ide_a2",
            "aii_1",
            "ide_b2"
          ]
        }
      ],
      "insight": {
        "title": "1위와 \"회의 후 할 일 정리\"는 같은 숨은 공통점에서 나왔어요",
        "body": "둘 다 팀플에서 \"누가 무엇을 했는지\"가 한곳에 남지 않는 문제를 풀어요. …",
        "threadId": "thr_1"
      }
    },
    "vote.revote": {
      "revoteId": "rv_1",
      "candidates": [
        "ide_a2",
        "aii_1",
        "ide_b2"
      ]
    },
    "topic.confirm": {
      "topic": {
        "ideaId": "ide_c1",
        "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹"
      },
      "leader": {
        "participantId": "par_03",
        "nickname": "김승희"
      },
      "stage": {
        "id": "team.split",
        "label": "파트 나누기 · 보고서",
        "subStep": 2,
        "progress": 70
      }
    },
    "team.parts": {
      "ready": true,
      "topic": {
        "ideaId": "ide_c1",
        "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹",
        "owner": {
          "nickname": "노형원",
          "rank": 1
        },
        "votes": 3,
        "feasibility": "상"
      },
      "parts": [
        {
          "partId": "prt_1",
          "tier": "core",
          "name": "화면 만들기",
          "desc": "공지 목록 · 마감 알림 화면",
          "skill": "프론트엔드",
          "status": "overlap",
          "candidates": [
            {
              "participantId": "par_01",
              "nickname": "노형원",
              "isMe": true
            },
            {
              "participantId": "par_02",
              "nickname": "이세민"
            }
          ]
        },
        {
          "partId": "prt_2",
          "tier": "core",
          "name": "서버 · 공지 모으기",
          "desc": "게시판 글 가져오기 · 알림 보내기",
          "skill": "백엔드",
          "status": "single",
          "candidates": [
            {
              "participantId": "par_04",
              "nickname": "박상진"
            }
          ]
        },
        {
          "partId": "prt_3",
          "tier": "core",
          "name": "발표 · 시연",
          "desc": "문제 정의 · 시연 흐름 · 질의응답",
          "skill": "발표·피칭",
          "status": "overlap",
          "candidates": [
            {
              "participantId": "par_01",
              "nickname": "노형원",
              "isMe": true
            },
            {
              "participantId": "par_02",
              "nickname": "이세민"
            }
          ]
        },
        {
          "partId": "prt_4",
          "tier": "normal",
          "name": "화면 디자인",
          "desc": "화면 분위기 · 컴포넌트 스타일",
          "skill": "웹 디자인",
          "status": "overlap",
          "candidates": [
            {
              "participantId": "par_02",
              "nickname": "이세민"
            },
            {
              "participantId": "par_03",
              "nickname": "김승희"
            }
          ]
        },
        {
          "partId": "prt_5",
          "tier": "normal",
          "name": "발표 자료",
          "desc": "장표 구성 · 시각화",
          "skill": "PPT 디자인",
          "status": "single",
          "candidates": [
            {
              "participantId": "par_03",
              "nickname": "김승희"
            }
          ]
        },
        {
          "partId": "prt_6",
          "tier": "normal",
          "name": "기획 · 범위 관리",
          "desc": "기능 범위 · 진행 조율",
          "skill": "서비스 기획",
          "status": "single",
          "candidates": [
            {
              "participantId": "par_01",
              "nickname": "노형원",
              "isMe": true
            }
          ]
        },
        {
          "partId": "prt_7",
          "tier": "normal",
          "name": "메일·LMS 자동 연동",
          "desc": "AI 검증에서 나온 팀에 없는 스킬",
          "skill": "외부 API 연동",
          "status": "none",
          "candidates": [],
          "alternative": "링크 붙여넣기로 대신하기"
        }
      ],
      "smallTasks": {
        "count": 6,
        "names": [
          "경쟁 서비스 조사",
          "사용자 인터뷰 3명",
          "시연용 예시 공지 만들기",
          "제출 문서 · 보고서 정리",
          "기능 테스트 · 버그 기록",
          "회의록 · 일정 챙기기"
        ],
        "note": "분량이 비슷해지게 나눠요"
      },
      "mine": [
        {
          "partId": "prt_1",
          "name": "화면 만들기",
          "status": "overlap"
        },
        {
          "partId": "prt_3",
          "name": "발표 · 시연",
          "status": "overlap"
        },
        {
          "partId": "prt_6",
          "name": "기획 · 범위 관리",
          "status": "single"
        }
      ],
      "myPendingQuestions": 0
    },
    "team.questions": {
      "remainingSec": 300,
      "items": [
        {
          "partId": "prt_1",
          "partName": "화면 만들기",
          "status": "answering",
          "otherCandidateCount": 1,
          "questions": [
            {
              "qid": "q1",
              "type": "choice",
              "text": "비슷한 화면을 끝까지 만들어 본 적 있나요?",
              "options": [
                {
                  "value": "none",
                  "label": "아직 없어요"
                },
                {
                  "value": "tutorial",
                  "label": "수업·튜토리얼로 따라 만들어 봤어요"
                },
                {
                  "value": "solo",
                  "label": "혼자 기능 있는 화면을 완성해 봤어요"
                },
                {
                  "value": "team",
                  "label": "팀 프로젝트에서 화면 파트를 맡아 완성했어요"
                }
              ],
              "detailLabel": "무엇을, 어떤 기술로 만들었는지 한 줄",
              "detailPlaceholder": "예: 동아리 행사 신청 웹 · React · 목록 필터를 맡음"
            },
            {
              "qid": "q2",
              "type": "text",
              "text": "이 파트에서 제일 까다로운 부분을 어떻게 만들지 3줄로 적어주세요",
              "context": "여러 곳에서 모은 공지를 **한 목록에 마감 가까운 순**으로 보여주고, **마감 하루 전**인 건 눈에 띄게 표시하기",
              "hint": "정답을 맞히는 문제가 아니에요. 얼마나 구체적으로 그려지는지를 봐요."
            }
          ],
          "answer": null
        },
        {
          "partId": "prt_3",
          "partName": "발표 · 시연",
          "status": "next",
          "otherCandidateCount": 1,
          "questions": [
            {
              "qid": "q1",
              "type": "choice",
              "text": "사람들 앞에서 발표나 시연을 맡아 본 적 있나요?",
              "options": [
                {
                  "value": "none",
                  "label": "아직 없어요"
                },
                {
                  "value": "class",
                  "label": "수업 발표를 해 봤어요"
                },
                {
                  "value": "contest",
                  "label": "공모전·해커톤에서 발표해 봤어요"
                },
                {
                  "value": "lead",
                  "label": "발표와 질의응답을 주도해서 맡아 봤어요"
                }
              ],
              "detailLabel": "어떤 자리에서, 무엇을 발표했는지 한 줄",
              "detailPlaceholder": "예: 교내 창업 경진대회 · 5분 피칭 · 질의응답 담당"
            },
            {
              "qid": "q2",
              "type": "text",
              "text": "처음 보는 심사위원에게 첫 30초 동안 무엇을 보여줄지 3줄로 적어주세요",
              "context": "공지를 놓쳐 마감을 넘긴 문제를 **짧게 공감**시키고, **시연 한 장면**으로 해결을 보여주기",
              "hint": "정답을 맞히는 문제가 아니에요. 얼마나 구체적으로 그려지는지를 봐요."
            }
          ],
          "answer": null
        }
      ]
    },
    "team.answer": {
      "saved": true,
      "nextPartId": "prt_3",
      "remaining": 1
    },
    "team.assignment": {
      "status": "draft",
      "version": 3,
      "leader": {
        "participantId": "par_03",
        "nickname": "김승희"
      },
      "viewer": {
        "participantId": "par_03",
        "isLeader": true
      },
      "members": [
        {
          "participantId": "par_01",
          "nickname": "노형원",
          "counts": {
            "core": 1,
            "normal": 1,
            "small": 0
          },
          "loadPct": 70,
          "over": false,
          "changeFromDraft": "less"
        },
        {
          "participantId": "par_04",
          "nickname": "박상진",
          "counts": {
            "core": 1,
            "normal": 0,
            "small": 1
          },
          "loadPct": 86,
          "over": false,
          "changeFromDraft": null
        },
        {
          "participantId": "par_03",
          "nickname": "김승희",
          "isMe": true,
          "counts": {
            "core": 0,
            "normal": 1,
            "small": 2
          },
          "loadPct": 84,
          "over": false,
          "changeFromDraft": null
        },
        {
          "participantId": "par_02",
          "nickname": "이세민",
          "counts": {
            "core": 1,
            "normal": 1,
            "small": 3
          },
          "loadPct": 100,
          "over": true,
          "changeFromDraft": "more"
        }
      ],
      "parts": [
        {
          "partId": "prt_1",
          "name": "화면 만들기",
          "tier": "core",
          "assignee": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "method": "question",
          "methodLabel": "추가 질문으로 정했어요",
          "changed": false
        },
        {
          "partId": "prt_2",
          "name": "서버 · 공지 모으기",
          "tier": "core",
          "assignee": {
            "participantId": "par_04",
            "nickname": "박상진"
          },
          "method": "single",
          "methodLabel": "후보 1명 · 백엔드",
          "changed": false
        },
        {
          "partId": "prt_3",
          "name": "발표 · 시연",
          "tier": "core",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "question",
          "methodLabel": "추가 질문으로 정했어요",
          "changed": true,
          "aiAssignee": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "marks": [
            {
              "participantId": "par_02",
              "nickname": "이세민"
            }
          ]
        },
        {
          "partId": "prt_4",
          "name": "화면 디자인",
          "tier": "normal",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "question",
          "methodLabel": "추가 질문으로 정했어요",
          "changed": false
        },
        {
          "partId": "prt_5",
          "name": "발표 자료",
          "tier": "normal",
          "assignee": {
            "participantId": "par_03",
            "nickname": "김승희"
          },
          "method": "single",
          "methodLabel": "후보 1명 · PPT 디자인",
          "changed": false
        },
        {
          "partId": "prt_6",
          "name": "기획 · 범위 관리",
          "tier": "normal",
          "assignee": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "method": "single",
          "methodLabel": "후보 1명 · 서비스 기획",
          "changed": false
        },
        {
          "partId": "prt_7",
          "name": "메일·LMS 자동 연동",
          "tier": "normal",
          "assignee": null,
          "method": "excluded",
          "methodLabel": "링크 붙여넣기로 대신 · 팀 선택",
          "changed": false,
          "alternative": "링크 붙여넣기로 대신"
        },
        {
          "partId": "prt_s1",
          "name": "경쟁 서비스 조사",
          "tier": "small",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s2",
          "name": "사용자 인터뷰 3명",
          "tier": "small",
          "assignee": {
            "participantId": "par_03",
            "nickname": "김승희"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s3",
          "name": "시연용 예시 공지 만들기",
          "tier": "small",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s4",
          "name": "제출 문서 · 보고서 정리",
          "tier": "small",
          "assignee": {
            "participantId": "par_03",
            "nickname": "김승희"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s5",
          "name": "기능 테스트 · 버그 기록",
          "tier": "small",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s6",
          "name": "회의록 · 일정 챙기기",
          "tier": "small",
          "assignee": {
            "participantId": "par_04",
            "nickname": "박상진"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        }
      ],
      "balance": {
        "note": "노형원 님에게 핵심 파트가 몰려서 작은 일은 드리지 않았어요. 작은 일 6개는 핵심 파트가 적은 사람일수록 더 맡아, 네 분의 분량이 비슷해지게 했어요.",
        "smallTaskCounts": [
          {
            "nickname": "이세민",
            "count": 3,
            "why": "보통 파트 1개"
          },
          {
            "nickname": "김승희",
            "count": 2,
            "why": "보통 파트 1개"
          },
          {
            "nickname": "박상진",
            "count": 1,
            "why": "핵심 파트 1개"
          }
        ]
      },
      "myParts": [],
      "markedByMe": [],
      "changes": [
        {
          "type": "mark",
          "partId": "prt_3",
          "partName": "발표 · 시연",
          "by": {
            "participantId": "par_02",
            "nickname": "이세민"
          }
        },
        {
          "type": "change",
          "partId": "prt_3",
          "partName": "발표 · 시연",
          "from": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "to": {
            "participantId": "par_02",
            "nickname": "이세민"
          }
        }
      ],
      "suggestion": {
        "suggestionId": "sug_1",
        "partId": "prt_s3",
        "partName": "시연용 예시 공지 만들기",
        "from": {
          "participantId": "par_02",
          "nickname": "이세민"
        },
        "to": {
          "participantId": "par_01",
          "nickname": "노형원"
        },
        "reason": "발표·시연을 이세민 님이 맡으면서 이세민 님 분량이 많아졌어요. 작은 일 하나를 옮기면 다시 비슷해져요."
      }
    },
    "team.mark": {
      "partId": "prt_3",
      "marked": true
    },
    "team.reassign": {
      "status": "draft",
      "version": 3,
      "leader": {
        "participantId": "par_03",
        "nickname": "김승희"
      },
      "viewer": {
        "participantId": "par_03",
        "isLeader": true
      },
      "members": [
        {
          "participantId": "par_01",
          "nickname": "노형원",
          "counts": {
            "core": 1,
            "normal": 1,
            "small": 0
          },
          "loadPct": 70,
          "over": false,
          "changeFromDraft": "less"
        },
        {
          "participantId": "par_04",
          "nickname": "박상진",
          "counts": {
            "core": 1,
            "normal": 0,
            "small": 1
          },
          "loadPct": 86,
          "over": false,
          "changeFromDraft": null
        },
        {
          "participantId": "par_03",
          "nickname": "김승희",
          "isMe": true,
          "counts": {
            "core": 0,
            "normal": 1,
            "small": 2
          },
          "loadPct": 84,
          "over": false,
          "changeFromDraft": null
        },
        {
          "participantId": "par_02",
          "nickname": "이세민",
          "counts": {
            "core": 1,
            "normal": 1,
            "small": 3
          },
          "loadPct": 100,
          "over": true,
          "changeFromDraft": "more"
        }
      ],
      "parts": [
        {
          "partId": "prt_1",
          "name": "화면 만들기",
          "tier": "core",
          "assignee": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "method": "question",
          "methodLabel": "추가 질문으로 정했어요",
          "changed": false
        },
        {
          "partId": "prt_2",
          "name": "서버 · 공지 모으기",
          "tier": "core",
          "assignee": {
            "participantId": "par_04",
            "nickname": "박상진"
          },
          "method": "single",
          "methodLabel": "후보 1명 · 백엔드",
          "changed": false
        },
        {
          "partId": "prt_3",
          "name": "발표 · 시연",
          "tier": "core",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "question",
          "methodLabel": "추가 질문으로 정했어요",
          "changed": true,
          "aiAssignee": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "marks": [
            {
              "participantId": "par_02",
              "nickname": "이세민"
            }
          ]
        },
        {
          "partId": "prt_4",
          "name": "화면 디자인",
          "tier": "normal",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "question",
          "methodLabel": "추가 질문으로 정했어요",
          "changed": false
        },
        {
          "partId": "prt_5",
          "name": "발표 자료",
          "tier": "normal",
          "assignee": {
            "participantId": "par_03",
            "nickname": "김승희"
          },
          "method": "single",
          "methodLabel": "후보 1명 · PPT 디자인",
          "changed": false
        },
        {
          "partId": "prt_6",
          "name": "기획 · 범위 관리",
          "tier": "normal",
          "assignee": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "method": "single",
          "methodLabel": "후보 1명 · 서비스 기획",
          "changed": false
        },
        {
          "partId": "prt_7",
          "name": "메일·LMS 자동 연동",
          "tier": "normal",
          "assignee": null,
          "method": "excluded",
          "methodLabel": "링크 붙여넣기로 대신 · 팀 선택",
          "changed": false,
          "alternative": "링크 붙여넣기로 대신"
        },
        {
          "partId": "prt_s1",
          "name": "경쟁 서비스 조사",
          "tier": "small",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s2",
          "name": "사용자 인터뷰 3명",
          "tier": "small",
          "assignee": {
            "participantId": "par_03",
            "nickname": "김승희"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s3",
          "name": "시연용 예시 공지 만들기",
          "tier": "small",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s4",
          "name": "제출 문서 · 보고서 정리",
          "tier": "small",
          "assignee": {
            "participantId": "par_03",
            "nickname": "김승희"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s5",
          "name": "기능 테스트 · 버그 기록",
          "tier": "small",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s6",
          "name": "회의록 · 일정 챙기기",
          "tier": "small",
          "assignee": {
            "participantId": "par_04",
            "nickname": "박상진"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        }
      ],
      "balance": {
        "note": "노형원 님에게 핵심 파트가 몰려서 작은 일은 드리지 않았어요. 작은 일 6개는 핵심 파트가 적은 사람일수록 더 맡아, 네 분의 분량이 비슷해지게 했어요.",
        "smallTaskCounts": [
          {
            "nickname": "이세민",
            "count": 3,
            "why": "보통 파트 1개"
          },
          {
            "nickname": "김승희",
            "count": 2,
            "why": "보통 파트 1개"
          },
          {
            "nickname": "박상진",
            "count": 1,
            "why": "핵심 파트 1개"
          }
        ]
      },
      "myParts": [],
      "markedByMe": [],
      "changes": [
        {
          "type": "mark",
          "partId": "prt_3",
          "partName": "발표 · 시연",
          "by": {
            "participantId": "par_02",
            "nickname": "이세민"
          }
        },
        {
          "type": "change",
          "partId": "prt_3",
          "partName": "발표 · 시연",
          "from": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "to": {
            "participantId": "par_02",
            "nickname": "이세민"
          }
        }
      ],
      "suggestion": {
        "suggestionId": "sug_1",
        "partId": "prt_s3",
        "partName": "시연용 예시 공지 만들기",
        "from": {
          "participantId": "par_02",
          "nickname": "이세민"
        },
        "to": {
          "participantId": "par_01",
          "nickname": "노형원"
        },
        "reason": "발표·시연을 이세민 님이 맡으면서 이세민 님 분량이 많아졌어요. 작은 일 하나를 옮기면 다시 비슷해져요."
      }
    },
    "team.suggestion": {
      "status": "draft",
      "version": 3,
      "leader": {
        "participantId": "par_03",
        "nickname": "김승희"
      },
      "viewer": {
        "participantId": "par_03",
        "isLeader": true
      },
      "members": [
        {
          "participantId": "par_01",
          "nickname": "노형원",
          "counts": {
            "core": 1,
            "normal": 1,
            "small": 0
          },
          "loadPct": 70,
          "over": false,
          "changeFromDraft": "less"
        },
        {
          "participantId": "par_04",
          "nickname": "박상진",
          "counts": {
            "core": 1,
            "normal": 0,
            "small": 1
          },
          "loadPct": 86,
          "over": false,
          "changeFromDraft": null
        },
        {
          "participantId": "par_03",
          "nickname": "김승희",
          "isMe": true,
          "counts": {
            "core": 0,
            "normal": 1,
            "small": 2
          },
          "loadPct": 84,
          "over": false,
          "changeFromDraft": null
        },
        {
          "participantId": "par_02",
          "nickname": "이세민",
          "counts": {
            "core": 1,
            "normal": 1,
            "small": 3
          },
          "loadPct": 100,
          "over": true,
          "changeFromDraft": "more"
        }
      ],
      "parts": [
        {
          "partId": "prt_1",
          "name": "화면 만들기",
          "tier": "core",
          "assignee": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "method": "question",
          "methodLabel": "추가 질문으로 정했어요",
          "changed": false
        },
        {
          "partId": "prt_2",
          "name": "서버 · 공지 모으기",
          "tier": "core",
          "assignee": {
            "participantId": "par_04",
            "nickname": "박상진"
          },
          "method": "single",
          "methodLabel": "후보 1명 · 백엔드",
          "changed": false
        },
        {
          "partId": "prt_3",
          "name": "발표 · 시연",
          "tier": "core",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "question",
          "methodLabel": "추가 질문으로 정했어요",
          "changed": true,
          "aiAssignee": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "marks": [
            {
              "participantId": "par_02",
              "nickname": "이세민"
            }
          ]
        },
        {
          "partId": "prt_4",
          "name": "화면 디자인",
          "tier": "normal",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "question",
          "methodLabel": "추가 질문으로 정했어요",
          "changed": false
        },
        {
          "partId": "prt_5",
          "name": "발표 자료",
          "tier": "normal",
          "assignee": {
            "participantId": "par_03",
            "nickname": "김승희"
          },
          "method": "single",
          "methodLabel": "후보 1명 · PPT 디자인",
          "changed": false
        },
        {
          "partId": "prt_6",
          "name": "기획 · 범위 관리",
          "tier": "normal",
          "assignee": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "method": "single",
          "methodLabel": "후보 1명 · 서비스 기획",
          "changed": false
        },
        {
          "partId": "prt_7",
          "name": "메일·LMS 자동 연동",
          "tier": "normal",
          "assignee": null,
          "method": "excluded",
          "methodLabel": "링크 붙여넣기로 대신 · 팀 선택",
          "changed": false,
          "alternative": "링크 붙여넣기로 대신"
        },
        {
          "partId": "prt_s1",
          "name": "경쟁 서비스 조사",
          "tier": "small",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s2",
          "name": "사용자 인터뷰 3명",
          "tier": "small",
          "assignee": {
            "participantId": "par_03",
            "nickname": "김승희"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s3",
          "name": "시연용 예시 공지 만들기",
          "tier": "small",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s4",
          "name": "제출 문서 · 보고서 정리",
          "tier": "small",
          "assignee": {
            "participantId": "par_03",
            "nickname": "김승희"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s5",
          "name": "기능 테스트 · 버그 기록",
          "tier": "small",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s6",
          "name": "회의록 · 일정 챙기기",
          "tier": "small",
          "assignee": {
            "participantId": "par_04",
            "nickname": "박상진"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        }
      ],
      "balance": {
        "note": "노형원 님에게 핵심 파트가 몰려서 작은 일은 드리지 않았어요. 작은 일 6개는 핵심 파트가 적은 사람일수록 더 맡아, 네 분의 분량이 비슷해지게 했어요.",
        "smallTaskCounts": [
          {
            "nickname": "이세민",
            "count": 3,
            "why": "보통 파트 1개"
          },
          {
            "nickname": "김승희",
            "count": 2,
            "why": "보통 파트 1개"
          },
          {
            "nickname": "박상진",
            "count": 1,
            "why": "핵심 파트 1개"
          }
        ]
      },
      "myParts": [],
      "markedByMe": [],
      "changes": [
        {
          "type": "mark",
          "partId": "prt_3",
          "partName": "발표 · 시연",
          "by": {
            "participantId": "par_02",
            "nickname": "이세민"
          }
        },
        {
          "type": "change",
          "partId": "prt_3",
          "partName": "발표 · 시연",
          "from": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "to": {
            "participantId": "par_02",
            "nickname": "이세민"
          }
        }
      ],
      "suggestion": {
        "suggestionId": "sug_1",
        "partId": "prt_s3",
        "partName": "시연용 예시 공지 만들기",
        "from": {
          "participantId": "par_02",
          "nickname": "이세민"
        },
        "to": {
          "participantId": "par_01",
          "nickname": "노형원"
        },
        "reason": "발표·시연을 이세민 님이 맡으면서 이세민 님 분량이 많아졌어요. 작은 일 하나를 옮기면 다시 비슷해져요."
      }
    },
    "team.revert": {
      "status": "draft",
      "version": 3,
      "leader": {
        "participantId": "par_03",
        "nickname": "김승희"
      },
      "viewer": {
        "participantId": "par_03",
        "isLeader": true
      },
      "members": [
        {
          "participantId": "par_01",
          "nickname": "노형원",
          "counts": {
            "core": 1,
            "normal": 1,
            "small": 0
          },
          "loadPct": 70,
          "over": false,
          "changeFromDraft": "less"
        },
        {
          "participantId": "par_04",
          "nickname": "박상진",
          "counts": {
            "core": 1,
            "normal": 0,
            "small": 1
          },
          "loadPct": 86,
          "over": false,
          "changeFromDraft": null
        },
        {
          "participantId": "par_03",
          "nickname": "김승희",
          "isMe": true,
          "counts": {
            "core": 0,
            "normal": 1,
            "small": 2
          },
          "loadPct": 84,
          "over": false,
          "changeFromDraft": null
        },
        {
          "participantId": "par_02",
          "nickname": "이세민",
          "counts": {
            "core": 1,
            "normal": 1,
            "small": 3
          },
          "loadPct": 100,
          "over": true,
          "changeFromDraft": "more"
        }
      ],
      "parts": [
        {
          "partId": "prt_1",
          "name": "화면 만들기",
          "tier": "core",
          "assignee": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "method": "question",
          "methodLabel": "추가 질문으로 정했어요",
          "changed": false
        },
        {
          "partId": "prt_2",
          "name": "서버 · 공지 모으기",
          "tier": "core",
          "assignee": {
            "participantId": "par_04",
            "nickname": "박상진"
          },
          "method": "single",
          "methodLabel": "후보 1명 · 백엔드",
          "changed": false
        },
        {
          "partId": "prt_3",
          "name": "발표 · 시연",
          "tier": "core",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "question",
          "methodLabel": "추가 질문으로 정했어요",
          "changed": true,
          "aiAssignee": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "marks": [
            {
              "participantId": "par_02",
              "nickname": "이세민"
            }
          ]
        },
        {
          "partId": "prt_4",
          "name": "화면 디자인",
          "tier": "normal",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "question",
          "methodLabel": "추가 질문으로 정했어요",
          "changed": false
        },
        {
          "partId": "prt_5",
          "name": "발표 자료",
          "tier": "normal",
          "assignee": {
            "participantId": "par_03",
            "nickname": "김승희"
          },
          "method": "single",
          "methodLabel": "후보 1명 · PPT 디자인",
          "changed": false
        },
        {
          "partId": "prt_6",
          "name": "기획 · 범위 관리",
          "tier": "normal",
          "assignee": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "method": "single",
          "methodLabel": "후보 1명 · 서비스 기획",
          "changed": false
        },
        {
          "partId": "prt_7",
          "name": "메일·LMS 자동 연동",
          "tier": "normal",
          "assignee": null,
          "method": "excluded",
          "methodLabel": "링크 붙여넣기로 대신 · 팀 선택",
          "changed": false,
          "alternative": "링크 붙여넣기로 대신"
        },
        {
          "partId": "prt_s1",
          "name": "경쟁 서비스 조사",
          "tier": "small",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s2",
          "name": "사용자 인터뷰 3명",
          "tier": "small",
          "assignee": {
            "participantId": "par_03",
            "nickname": "김승희"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s3",
          "name": "시연용 예시 공지 만들기",
          "tier": "small",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s4",
          "name": "제출 문서 · 보고서 정리",
          "tier": "small",
          "assignee": {
            "participantId": "par_03",
            "nickname": "김승희"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s5",
          "name": "기능 테스트 · 버그 기록",
          "tier": "small",
          "assignee": {
            "participantId": "par_02",
            "nickname": "이세민"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        },
        {
          "partId": "prt_s6",
          "name": "회의록 · 일정 챙기기",
          "tier": "small",
          "assignee": {
            "participantId": "par_04",
            "nickname": "박상진"
          },
          "method": "balance",
          "methodLabel": "분량 맞추기",
          "changed": false
        }
      ],
      "balance": {
        "note": "노형원 님에게 핵심 파트가 몰려서 작은 일은 드리지 않았어요. 작은 일 6개는 핵심 파트가 적은 사람일수록 더 맡아, 네 분의 분량이 비슷해지게 했어요.",
        "smallTaskCounts": [
          {
            "nickname": "이세민",
            "count": 3,
            "why": "보통 파트 1개"
          },
          {
            "nickname": "김승희",
            "count": 2,
            "why": "보통 파트 1개"
          },
          {
            "nickname": "박상진",
            "count": 1,
            "why": "핵심 파트 1개"
          }
        ]
      },
      "myParts": [],
      "markedByMe": [],
      "changes": [
        {
          "type": "mark",
          "partId": "prt_3",
          "partName": "발표 · 시연",
          "by": {
            "participantId": "par_02",
            "nickname": "이세민"
          }
        },
        {
          "type": "change",
          "partId": "prt_3",
          "partName": "발표 · 시연",
          "from": {
            "participantId": "par_01",
            "nickname": "노형원"
          },
          "to": {
            "participantId": "par_02",
            "nickname": "이세민"
          }
        }
      ],
      "suggestion": {
        "suggestionId": "sug_1",
        "partId": "prt_s3",
        "partName": "시연용 예시 공지 만들기",
        "from": {
          "participantId": "par_02",
          "nickname": "이세민"
        },
        "to": {
          "participantId": "par_01",
          "nickname": "노형원"
        },
        "reason": "발표·시연을 이세민 님이 맡으면서 이세민 님 분량이 많아졌어요. 작은 일 하나를 옮기면 다시 비슷해져요."
      }
    },
    "team.confirm": {
      "status": "confirmed",
      "reportReady": false,
      "stage": {
        "id": "report",
        "label": "파트 나누기 · 보고서",
        "subStep": 6,
        "progress": 100
      }
    },
    "report.get": {
      "ready": true,
      "reportId": "rep_7K2X9",
      "sessionId": "ses_7K2X9",
      "version": 1,
      "createdAt": "2026-09-18T16:10:00+09:00",
      "meta": {
        "date": "2026-09-18",
        "memberCount": 4,
        "durationMin": 70,
        "sessionTopic": "교내 해커톤 서비스 아이디어"
      },
      "topic": {
        "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹",
        "summary": "메일·학교 사이트·단톡에 흩어진 과제 공지와 마감을 한 화면에 모아 알려줘요.",
        "owner": {
          "nickname": "노형원",
          "rank": 1
        }
      },
      "why": {
        "votes": {
          "total": 8,
          "top": 3,
          "gapToSecond": 1
        },
        "review": {
          "grade": "go",
          "summary": "일정 앱은 많지만 여러 곳의 학교 공지를 모아주는 건 드물어요",
          "searchUrl": "https://search.example.com/?q=..."
        },
        "praise": {
          "count": 2,
          "points": [
            "다들 겪는 문제라 공감이 커요",
            "발표하기 쉬워요"
          ]
        },
        "thread": "팀플에서 \"누가 무엇을 했는지\"가 한곳에 남지 않는 문제와 이어져요 (3위 아이디어도 같은 뿌리)"
      },
      "feasibility": {
        "level": "상",
        "summary": "웹 화면 2명 · 백엔드 1명으로 만들 수 있어요",
        "missingSkills": [
          {
            "name": "메일·LMS 자동 연동",
            "decision": "이번 범위에서 빼고 링크 붙여넣기로 대신"
          }
        ],
        "scope": "핵심 기능은 공지 모으기 · 마감 알림 두 가지로 시작해요"
      },
      "votes": {
        "maxVotesPerPerson": 2,
        "ranks": [
          {
            "rank": 1,
            "title": "과제 공지와 마감을 한곳에 모아 알려주는 웹",
            "owner": "노형원",
            "votes": 3
          },
          {
            "rank": 2,
            "title": "관심 있는 학교 행사·특강 소식만 골라 알려주는 웹",
            "owner": "김승희",
            "votes": 2
          },
          {
            "rank": 3,
            "title": "회의 후 할 일 정리 · 열람실 빈자리 제보판 · 학과 중고 전공책",
            "owner": null,
            "tieCount": 3,
            "votes": 1
          }
        ]
      },
      "parts": {
        "leader": "김승희",
        "core": [
          {
            "name": "화면 만들기",
            "assignee": "노형원"
          },
          {
            "name": "서버 · 공지 모으기",
            "assignee": "박상진"
          },
          {
            "name": "발표 · 시연",
            "assignee": "이세민"
          }
        ],
        "normal": [
          {
            "name": "화면 디자인",
            "assignee": "이세민"
          },
          {
            "name": "발표 자료",
            "assignee": "김승희"
          },
          {
            "name": "기획 · 범위 관리",
            "assignee": "노형원"
          }
        ],
        "small": [
          {
            "name": "경쟁 서비스 조사",
            "assignee": "이세민"
          },
          {
            "name": "시연용 예시 공지 만들기",
            "assignee": "노형원"
          },
          {
            "name": "기능 테스트 · 버그 기록",
            "assignee": "이세민"
          },
          {
            "name": "사용자 인터뷰 3명",
            "assignee": "김승희"
          },
          {
            "name": "제출 문서 · 보고서 정리",
            "assignee": "김승희"
          },
          {
            "name": "회의록 · 일정 챙기기",
            "assignee": "박상진"
          }
        ],
        "excluded": [
          {
            "name": "메일·LMS 자동 연동",
            "alternative": "링크 붙여넣기로 대신"
          }
        ]
      },
      "workflow": {
        "stages": [
          {
            "no": 1,
            "name": "범위와 설계 정하기",
            "current": true,
            "make": "핵심 기능 2개의 화면 흐름 · 공지를 가져올 게시판 3곳",
            "tasks": [
              {
                "nickname": "노형원",
                "text": "기능 범위와 화면 흐름 정리",
                "lead": "이끌기"
              },
              {
                "nickname": "박상진",
                "text": "게시판 3곳에서 글을 가져올 수 있는지 확인",
                "lead": null
              },
              {
                "nickname": "김승희",
                "text": "사용자 인터뷰 3명으로 불편 확인",
                "lead": null
              },
              {
                "nickname": "이세민",
                "text": "경쟁 서비스 조사해서 공유",
                "lead": null
              }
            ],
            "handoffs": [
              "화면 흐름 노형원 → 이세민",
              "가져올 수 있는 게시판 박상진 → 노형원"
            ]
          },
          {
            "no": 2,
            "name": "만들기",
            "current": false,
            "make": "공지 목록 · 마감 알림이 동작하는 웹",
            "tasks": [
              {
                "nickname": "노형원",
                "text": "공지 목록·마감 표시 화면 · 시연용 예시 공지",
                "lead": "이끌기 · 화면"
              },
              {
                "nickname": "박상진",
                "text": "공지 모으기 · 알림 보내기",
                "lead": "이끌기 · 서버"
              },
              {
                "nickname": "이세민",
                "text": "화면 디자인 · 발표 흐름 초안",
                "lead": null
              },
              {
                "nickname": "김승희",
                "text": "발표 자료 틀 · 서비스 이름 정하기",
                "lead": null
              }
            ],
            "handoffs": [
              "화면 디자인 이세민 → 노형원",
              "공지 데이터 형식 박상진 ↔ 노형원"
            ]
          },
          {
            "no": 3,
            "name": "합치고 확인하기",
            "current": false,
            "make": "처음부터 끝까지 시연되는 버전",
            "tasks": [
              {
                "nickname": "노형원",
                "text": "화면과 서버 연결 (박상진과 함께)",
                "lead": null
              },
              {
                "nickname": "박상진",
                "text": "서버 연결 · 시연 환경 준비",
                "lead": null
              },
              {
                "nickname": "이세민",
                "text": "기능 테스트 · 버그 기록",
                "lead": "이끌기"
              },
              {
                "nickname": "김승희",
                "text": "인터뷰 결과를 발표 자료에 반영",
                "lead": null
              }
            ],
            "handoffs": [
              "버그 목록 이세민 → 노형원 · 박상진"
            ]
          },
          {
            "no": 4,
            "name": "발표 준비",
            "current": false,
            "make": "발표 자료 · 시연 · 제출 문서",
            "tasks": [
              {
                "nickname": "이세민",
                "text": "발표 흐름 · 시연 연습",
                "lead": "이끌기 · 발표"
              },
              {
                "nickname": "김승희",
                "text": "발표 자료 완성 · 제출 문서 정리",
                "lead": "이끌기 · 자료"
              },
              {
                "nickname": "노형원",
                "text": "시연 화면 점검 · 리허설 피드백",
                "lead": null
              },
              {
                "nickname": "박상진",
                "text": "시연 환경 최종 점검",
                "lead": null
              }
            ],
            "handoffs": [
              "발표 자료 김승희 → 이세민"
            ]
          }
        ],
        "always": [
          {
            "text": "회의록 · 일정 챙기기",
            "nickname": "박상진"
          },
          {
            "text": "기능 범위 지키기",
            "nickname": "노형원"
          }
        ]
      },
      "anonymous": [
        "댓글 쓴 사람",
        "누가 어디에 투표했는지",
        "인터뷰 답 원문",
        "추가 질문의 답"
      ]
    }
  };

  /* 입력에 따라 결과가 달라지는 API만 여기서 흉내 (나머지는 위 data의 예시 응답 그대로) */
  let iceStep = 1, iceFollowed = false, iceInit = false;
  function syncIce() { if (iceInit) return; iceInit = true; const n = parseInt((document.querySelector('.ch-n') || {}).textContent, 10); if (n) iceStep = n; }
  const Q = ['최근 일주일, 가장 불편했던 순간은 언제였어요? 사소한 것도 좋아요.',
    "요즘 '캠퍼스 생활 서비스' 주변 소식이에요. 모르는 분야여도 괜찮아요, 들어봤는지 눌러주세요.",
    '방금 본 변화 중 하나 때문에 **새로 가능해지거나 더 불편해질** 사람이 주변에 있나요?',
    '요즘 가장 자주 쓰는 앱이나 서비스는 뭐고, **아쉬운 점**은요?',
    '마지막이에요. 이번에 **해보고 싶은 것**과 **피하고 싶은 것**이 있나요?'];
  const L = ['질문 1 · 불편했던 순간', '질문 2 · 요즘 바뀐 것', '질문 3 · 변화 × 내 경험', '질문 4 · 요즘 쓰는 서비스', '질문 5 · 해보고 싶은 것 · 피하고 싶은 것'];
  function nextQ() {
    iceFollowed = false;
    if (iceStep >= 5) return { step: 5, done: true, messages: [{ role: 'ai', style: 'good', text: '끝! 수고했어요. 진행자가 단계를 넘기면 함께 발산으로 이동해요.' }] };
    iceStep++;
    return { step: iceStep, done: false, messages: [{ role: 'ai', text: '좋아요, 충분해요. 다음으로 갈게요.' }, { role: 'ai', label: L[iceStep - 1], text: Q[iceStep - 1] }] };
  }
  let praiseUsed = 1, concernDone = 4, myVotes = ['ide_c1'];
  const fail = (code, message, status) => { const e = new api.ApiError(code, message, status); throw e; };

  const overrides = {
    'auth.login': ({ body }) => { if (!body.email || !body.password) fail('VALIDATION', '이메일과 비밀번호를 입력해 주세요', 400); return null; },
    'auth.signup': ({ body }) => {
      if (!body.agreements.terms || !body.agreements.privacy) fail('VALIDATION', '필수 약관에 동의해 주세요', 400);
      if ((body.password || '').length < 8) fail('VALIDATION', '비밀번호는 8자 이상이에요', 400); return null;
    },
    'session.create': ({ body }) => {
      if (!body.topic) fail('VALIDATION', '이번 회의에서 정할 주제를 적어주세요', 400);
      if (body.durationMin == null || body.durationMin > 30) fail('PLAN_LIMIT', '무료 플랜은 세션을 30분까지 만들 수 있어요', 403); return null;
    },
    'session.lookup': ({ query }) => { if (!/^[0-9A-Z]{6}$/.test(query.code || '')) fail('SESSION_NOT_FOUND', '없는 방 코드예요. 다시 확인해 주세요', 404); return null; },
    'auth.logout': () => { App.logoutLocal(); return null; },
    'ice.send': ({ body }) => {
      syncIce();
      const text = (body.text || '').trim();
      if (text.length < 15 && !iceFollowed) { iceFollowed = true; return { step: iceStep, done: false, messages: [{ role: 'ai', label: '꼬리질문', style: 'fq', text: '조금만 더 알려줄래요? **언제, 어디서** 그랬는지요.' }] }; }
      return nextQ();
    },
    'ice.skip': () => { syncIce(); return nextQ(); },
    'ice.explain': ({ body }) => ({ message: { role: 'ai', style: 'explain', text: `**${body.term}**는 쉽게 말하면 … (백엔드 연결 후 AI 뜻풀이가 들어가요)` }, askedTerms: [body.term] }),
    'idea.submit': ({ body }) => { const n = body.ideas.filter(i => i.text.trim()).length; if (n < 1 || n > 3) fail('VALIDATION', '아이디어는 1~3개 적어주세요', 400); return null; },
    'comment.create': ({ body }) => {
      if (!body.concern || !body.concern.trim()) fail('VALIDATION', '아쉬운 점은 꼭 적어주세요', 400);
      if (body.praise && praiseUsed >= 2) fail('PRAISE_LIMIT', '좋은 점은 2개까지만 쓸 수 있어요', 409);
      if (body.praise) praiseUsed++; concernDone++;
      return { saved: true, quota: { concernDone, concernTotal: 9, praiseUsed, praiseMax: 2 } };
    },
    'vote.save': ({ body }) => { if (body.ids.length > 2) fail('VOTE_LIMIT', '한 사람당 2표까지예요', 409); myVotes = body.ids.slice(); return { myVotes, remaining: 2 - myVotes.length }; },
    'team.answer': ({ params, body }) => {
      if (!body.answers || !body.answers.q1 || !body.answers.q1.choice) fail('VALIDATION', '보기 중 하나를 골라주세요', 400);
      if (!body.answers.q2 || !(body.answers.q2.text || '').trim()) fail('VALIDATION', '까다로운 부분을 어떻게 만들지 적어주세요', 400);
      const first = params.partId === 'prt_1';
      return { saved: true, nextPartId: first ? 'prt_3' : null, remaining: first ? 1 : 0 };
    },
    'team.mark': ({ params, body }) => ({ partId: params.partId, marked: !!body.marked }),
  };

  const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));
  return {
    data,
    async handle(id, ctx) {
      await new Promise((r) => setTimeout(r, (window.IE_CONFIG || {}).mockDelay || 300));
      if (overrides[id]) { const r = overrides[id](ctx); if (r != null) return clone(r); }
      return clone(data[id]);
    },
    stream() { return { close() {} }; }   // 목업에서는 실시간 이벤트를 보내지 않음
  };
})();
