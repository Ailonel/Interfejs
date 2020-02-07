//ustawienie interfejsu rozpoznawania mowy
window.SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;

//sprawdzenie czy interfejs rozpoznawania mowy jest obsługiwany przez przeglądarkę
if ('SpeechRecognition' in window){
	//utworzenie obiektu odpowiedzialnego za rozpoznawanie mowy
	var recognition = new window.SpeechRecognition();

	//ustawienie parametrów rozpoznawania mowy
	recognition.interimResults = true;	//interpretacja 'na bieżąo' otrzymanego wyrażenia
	recognition.maxAlternatives = 0;	//liczba alternatywnych wyników rozpoznawania
	recognition.continuous = true;		//rozpoznawanie mowy pozostaje aktywne po otrzymaniu wynik
	recognition.language="pl-PL";		//rozpoznawany język

	//smienne dodatkowe
	var screen = document.getElementById("screen");
	var recognitionScreen = document.getElementById("recognitionScreen");
	var translator;
	var tmp = '';
	var dictionary=[];
	var transcriptControl=/przez/;
	var finalTranscript = [];

	//słownik do weryfikacji i korekty dyktowanych wyrażeń
	dictionary[0]=/(doda(j|ć)|plus)/;
	dictionary[1]=/(od(jąć|ejmij)|minus)/;
	dictionary[2]=/((po)?mn(óż|ożone)|razy|x|X)/;
	dictionary[3]=/((po)?dziel(one|ić))/;
	dictionary[4]=/(przecinek|kropka)/;
	dictionary[5]=/,/;
	dictionary[6]=/(do potęgi|potęga)/;
	dictionary[7]=/(otw(órz|orzyć) (nawias|\())|(\()/;
	dictionary[8]=/(zamkn(ąć|ij) (nawias|\())/;
	dictionary[9]=/([0-9]*)/;

	for (i=0; i<dictionary.length; i++){
		transcriptControl=new RegExp(transcriptControl.source + "|" +dictionary[i].source);
	};
	transcriptControl = new RegExp(transcriptControl.source, "g");

	//zachownie gdy wystąpi błąd, np. nie udzielono pozwolenia na mikrofon
	recognition.onerror = function(event) {
		micDispContr(2);
	};

	recognition.onresult = function(event) {
		var interimTranscript = '';
		var button = document.getElementById("mButton");
		var infCheck = 0;
		//rozpoznawanie ‘na bieżąco’ otrzymywanego wejścia głosowego
		  for (var i = event.resultIndex, len = event.results.length; i < len; i++) {
			infCheck+=1;
			transcript = event.results[i][0].transcript;
			button.style.backgroundColor="yellow";
			recognitionScreen.value=transcript;
			
			//obróbka otrzymanego wejścia po zaprzestaniu dyktowania
			if(event.results[i].isFinal){	
				
				//sprawdzanie poprawności wyrażenia (odrzucenie innych wyrazów niż w słowniku)		
				finalTranscript=transcript.match(transcriptControl) || [];
					
				//korekta znaków w wyrażeniu
				for (var i=0; i<finalTranscript.length; i++){
					finalTranscript[i] = finalTranscript[i].replace(dictionary[0], '+')
					.replace(dictionary[1], '-')
					.replace(dictionary[2], '*')
					.replace(dictionary[3], '/')
					.replace(dictionary[4], '.')
					.replace(dictionary[5], '.')
					.replace(dictionary[6], '^')
					.replace(dictionary[7], '(')
					.replace(dictionary[8], ')')
					.replace(/przez/,"");

					screen.value += finalTranscript[i];
				}
				//czyszczenie otrzymanego wyjścia i zmiana przycisku mikrofonu
				recognitionScreen.value="";
				button.style.backgroundColor="initial";
				
				//obsługa pozostałych komend głosowych
				if (transcript.match(/\D*równa się|wynosi|wynik/)){
					transcript=transcript.replace(/równa się/, '');
					evaluation();
					end();
					document.getElementById("mButton").innerHTML="<i class=\"fas fa-microphone-alt-slash\"></i>";
				}
				if (transcript.match(/\D*cofnij/i)){
					transcript=transcript.replace(/cofnij/i, '');
					cancelAlt();
				}
				if (transcript.match(/\D*usuń/i)){
					cancel();
				}
				if (infCheck>10)
					end ();
					break;
			}
		}
	};
	//początek rozpoznawania mowy
	function start () {
		recognition.start();
		micDispContr(1);
	};
	//zakończenie rozpoznawania mowy		
	function end () {
		recognition.stop();
		micDispContr(2);
	};
	//funkcja odpowiedzialna za zmianę wyglądu przycisku mikrofonu oraz pokazywanie panelu dodatkowego kalkulatora
	function micDispContr(option){
		var disp = document.getElementsByClassName("b3El")
		if(option==1){
			document.getElementById("mButton").innerHTML="<i class=\"fas fa-microphone-alt\"></i>";
			document.getElementById("mButton").onclick=end;
			for (var i=0; i<disp.length; i++)
				disp[i].style.opacity="1";
		}
		if (option==2){
			document.getElementById("mButton").innerHTML="<i class=\"fas fa-microphone-alt-slash\"></i>";
			document.getElementById("mButton").onclick=start;
			for (var i=0; i<disp.length; i++)
				disp[i].style.opacity="0";
		}
	};
}
else{
	alert("Przeglądarka nie wspiera rozpoznawania mowy. Otwórz program przy pomocu Google Chrome");
}
//interakcja za pomocą klawiatury
function keyListener(event){
	if (!isNaN(event.key) || event.key==="+" || event.key==="-" || event.key==="*" || event.key==="/" || event.key==="^" || event.key==="."){
		screen.value+=event.key;
	}
	if (event.key === "Enter" || event.key==="=") {
		evaluation();
	}
};
//obsługa klawisza '()'
function bracket(){	
	var tmp = screen.value;
	var len = tmp.length;
	var leftBracket=(tmp.match(/\(/g)||[]).length;
	var rightBracket=(tmp.match(/\)/g)||[]).length;
	
	if(tmp.length==0)
		screen.value = screen.value + "(";
	else if(!isNaN(tmp[len-1])||tmp[len-1]==")")
		screen.value = screen.value + ")";
	else
		screen.value = screen.value + "(";
		
};
//obsługa wyświetlacza kalkulatora
function numInput(el){	
	screen.value = screen.value + el.innerHTML;
};
//obliczanie wyniku
function evaluation(){
	var expr = '';
	try{
		screen.value = math.eval(screen.value);
	}
	catch(error){
		screen.value ='';
	}
};
//usuwanie danych z wyświetlacza
function cancel(){
	screen.value = '';
};
//usuwanie pojedyńczych znaków z wyświetlacza
function cancelAlt(){
	var tmp = screen.value.length;
	var tmp1 = screen.value;
	if(tmp>0){
		screen.value=tmp1.slice(0,-1);
	}
};