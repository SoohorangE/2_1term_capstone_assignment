GOOGLE_API_KEY = ""

let imagestring = "";

function processFile(event)
{
    content = event.target.result;
    // 정규식 활용
    imagestring = content.replace(/^data:image\/(png|jpg|jpeg);base64,/, '');  
    document.getElementById("gimage").src = content
    console.log(imagestring)
}

function uploadFiles(files)
{
    file = files[0]

    reader = new FileReader()
    reader.onloadend = processFile
    reader.readAsDataURL(file)
}

function analyze()
{
    data = {
        "requests": [{
            "image":{
                "content": imagestring
            },
            "features":[{
                "type":"FACE_DETECTION",
                "maxResults": 255
            }]
        }]
    }

    $.ajax({
        type:"post",
        url: 'https://vision.googleapis.com/v1/images:annotate?key='+GOOGLE_API_KEY,
        data: JSON.stringify(data),
        contentType: "application/json"
    }).done(function(response){
        displayFaceExpressions(response)
    }).fail(function(error){
        console.log(error);
    })
}

function convertLikelihoodToPercent(likelihood) {
    switch (likelihood) {
        case 'VERY_UNLIKELY': return 0;
        case 'UNLIKELY': return 25;
        case 'POSSIBLE': return 50;
        case 'LIKELY': return 75;
        case 'VERY_LIKELY': return 100;
        default: return 0;
    }
}

function displayFaceExpressions(response) {
    const resultArea = document.getElementById("result");
    resultArea.value = ""; // 이전 결과 초기화

    let index = 0;

    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const image = document.getElementById("gimage");

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 이전 그리기 초기화

    if (response.responses[0].faceAnnotations) {
        response.responses[0].faceAnnotations.forEach(face=> {
            const joyLikelihood = face.joyLikelihood;
            const sorrowLikelihood = face.sorrowLikelihood;
            const angerLikelihood = face.angerLikelihood;
            const surpriseLikelihood = face.surpriseLikelihood;


            const boundingPoly = face.boundingPoly.vertices;
            const x = boundingPoly[0].x;
            const y = boundingPoly[0].y;
            const width = boundingPoly[2].x - x;
            const height = boundingPoly[2].y - y;

            // 얼굴 영역에 사각형 그리기
            ctx.strokeStyle = "red"; // 사각형 색상
            ctx.lineWidth = 3; // 선 두께
            ctx.strokeRect(x, y, width, height); // 사각형 그리기

            
            // 다양한 얼굴이 들어있을수 있으므로 인덱스를 늘려줌
            index += 1;

            let expressions = "";

            expressions += "얼굴" + (index) +"\n"
            expressions += "표정 정보\n\n"
            if(joyLikelihood)
            {
                expressions += "기쁨:" + convertLikelihoodToPercent(joyLikelihood) +"%\n"   
            }
            if(sorrowLikelihood)
            {   
                expressions += "슬픔:" + convertLikelihoodToPercent(sorrowLikelihood) +"%\n" 
            }
            if(angerLikelihood)
            {
                expressions += "분노:" + convertLikelihoodToPercent(angerLikelihood) +"%\n" 
            }
            if(surpriseLikelihood)
            {
                expressions += "놀람:" + convertLikelihoodToPercent(surpriseLikelihood) +"%\n" 
            }

            expressions += "---------------------------------------------------------------------\n"

            resultArea.value += expressions;
        });
    } else {
        resultArea.value = "얼굴을 감지할 수 없습니다.";
    }
}