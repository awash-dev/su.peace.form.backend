import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DB,
  ssl: { rejectUnauthorized: false },
});

const rawData = `1.		TEWABE MULAT TIRUNEH 	LOGISTICS 		2019	0943466166	CAFFE
2.		DAWUD IBRAHIM DAWUD 	WATER ENGINEER	SU1400980	2019	0918511575	CAFFE
3.		ABDUL HAFIZ MOHAMMED 	COTM 		2019	0963655186	CAFFE
4.		KADIR ALEMU 	COTEM 		2019	0917147116	CAFFE
5.		FUAD MAKONEN 	P.SCIENCES		2021	0943762892	CAFFE
6.		ALI AHMED ALI 	HI		2019	0912103129	CAFFE
7.		AHMEDIN ISSE	LOGISTICS 		2019	0901477156	CAFFE
8.		AYTILE HAMED AYTILE 	RDAE		2019	0914428140	CAFFE
9.		ROMAN EBRAHIM 	HI		2019	0972326999	CAFFE
10.		MULUKEN ZEMEDE 	MANAGEMENT 		2020	0951051871	CAFFE
11.		WAYNESHIT DEMISE	LOGISTICS		2019	0944459224	CAFFE
12.		TIGIST LEMA 	ACCOUNTING 		2019	0987275695	CAFFE
13.		DAWUD EBRAHIM ABDU	NARM		2019	0920343893	CAFFE
14.		WALIGE;LE AHMED 	ABVM		2019	0956671711	CAFFE
15.		ABDU SELAM ENDRIS 	MANAGEMENT		2020	0988595525	CAFFE
16.		AMARE ASMAMAW	V.MEDICINE			0967982673	CAFFE
17.		IBARAHIM GETAYE	GEOGRAPHY		2020	0952290735	CAFFE
18.		SISAY GETAMESAY	ECONOMICS		2020	0926754551	CAFFE
19.		YONAS BELAY 	V.MEDICINE		2024	0913381009	CAFFE
20.		HUSSIEN ABDO	LOGISTICS		2018	0914581759	CAFFE
21.		MOD MAKUACH	EDPM		2020	0966660853	CAFFE
22.		DANIEL BERIHUN 	EDPM		2020	0960656019	CAFFE
23.		AMANUEL DITTA 	SOCIOLOGY		2019	0932160985	SPACE POLICE
24.		MOHAMMED ALI 	V.MEDICINE 		2020	0954095764	SPACE POLICE 
25.		KAILECH WIYUAL 	WATER ENGI		2019	0908557358	SPACE POLICE
26.		BELAYEHUN ASEFA	LOGISTICS		2020	0930235703	SPACE POLICE
27.		ALEBACHEW GETACHEW	ECONOMICS			0966207162	SPACE POLICE
28.		YARED ABRAHA	TOURISM			0921778432	SPACE POLICE
29.		SHAMBEL MESELE	LOW			0903041878	SPACE POLICE
30.		HAILE YOSEF	ECONOMICS			0920858351	SPACE POLICE
31.		SEID ABDU	ACOUNTING			0922854399	SPACE POLICE
32.		GETU ZELALEM	V.MEDICINE			0927902911	SPACE POLICE
33.		 TEZERA BEDADO	V.MEDICINE 			0979141447	SPACE POLICE
34.		TEFSYE TAMIRU	MANAGEMENT			0948873552	SPACE POLICE
35.		HABIB M.D ABDUREZAK	JOURNALISM			0932440030	SPACE POLICE
36.		SELEAMLAK TADESSE	C.SCIENCES			0982883988	SPACE POLICE
37.		MUUSA MOHAMMED ALI	COTM 			0942686807	SPACE POLICE
38.		MOHAMMED HASSEN	NARM			0957074896	SPACE POLICE
39.		FIKADU ALEMKERA	LOW			0930445602	SPACE POLICE
40.		KIROBLE DESEALEGN	C.SCIENCE			0992736436	SPACE POLICE
41.		HUSSIEN ALI MUUSA	P.SCIENCE 			0925307653	SPACE POLICE
42.		YEBIBAL KINDU	SOCIOLOGY			0988378391	SPACE POLICE
43.		SAMUEL TEEGN 	SOCIOLOGY			0912790836	SPACE POLICE
44.		AYUB ANWAR 	ACCOUNTTING			0982827493	SPACE POLICE
45.		MESEFINT ABARE 	MIDYFERY			0930742620	SPACE POLICE
46.		ADERAJEW DERES 	V, MEDICINE 			0930742620	SPACE POLICE
47.		MARIYE ALEMU	TOURISM			0935350671	SPACE POLICE
48.		MESEFINT TESFAHUN 	MEDICINE			0930742620	SPACE POLICE
49.		SAMUEL AYTOLI 	MIDYFERY			0918104543	SPACE POLICE
50.		MARIYE ALEMU	TOURISM			0935350671	SPACE POLICE
51.		MESEFINT TESFAHUN	V. MEDICINE			0930742620	SPACE POLICE
52.		SAMUEL AYTOLI	MIDYFERY			0918104543	SPACE POLICE
53.		ATNATAWET TASFEW	V.MEDICEN		2022	0925806777	TEACH HIM
54.		MANAYE YITE	LOGISTIC		2020	0968133470	PEACE VALUE ORGANTION SECTORE
55.		BASEWU ALAMYE	ECONOMICS		2020 	0924620116	GREEN AREA
56.		ASCHILO ASMARE	ICT		2020	0956231899	LIBRERIY
57.		SHARWU AREGAWI 	PLANT SCINCE		2020 	0903905734	GENERAL SERVICE
58.		MAHAMMED AHMED 	RDEA		2020	0906343659 	DISPILEN
59.		ABDUL BAHRI AHMED	ELECTIRICAL		2019 	0937935498	SPORT
60.		NUREDIN JAMEL	RDEA		2020	0939451604	HEALTH
61.		EKRAM ABEBU	NURSING		2019	0935363745	WOMEN AFFAIR
62.		FELGECH  TASFA	NURSING		2019	0954980984	BLOCK
63.		TSIYO WASIHU	NURSING		2019	096086560	INFORMATION
64.		ALEM TSAHAY 	NURSIN		2019	0983205204	TEACHE HIM 
65.		WERKENESH DEFARU 	NURSING 		2019	0904141247	GREEN AREA 
66.		MESERET MELAKU	NURSING 		2019	0973073768	PEACE VALUE ORGANTION SECTORE
67.		ANDUALEM AROGEW 	GEOGRAPHY 		2021	0907120044	GENERAL SERVICE
68.		AMARE MESFEN	MEDICINE 		2021	0930701454	LITERARY 
69.		ASTER DEJENEW 	MANAGEMENT 		2019	0905225202	WOMEN AFFAIR 
70.		BESRAST  ZEWDU 	ELECTRICAL ENGINEERING 		2022	0969020904	DISPILEN  
71.		ABEBECHN BIRARA	MANAGEMENT 		2019	0905225202	WOMEN AFFAIR 
72.		ALEMNAT WENDEMSET 	MANAGEMENT 		2019	0908627176	HEALTH  
73.		TEGIST WAKA 	MARKETING 		2019	0948893082	WOMEN AFFAIR 
74.		ASTER ASECHAL 	MANAGEMENT 		2019	0974815745	HEALTH 
75.		ZENAWIT DAMTE 	MANAGEMENT 		2019	0920124393	BLOCK 
76.		ABDU AWEL 	HI		2021	0927088073	INFORMATION 
77.		OUSMAN KEDER 	HI		2019	0925060831	TEACHING 
78.		HUSSEN AHMED 	HI		2021	0929208861	PEACE VALUE ORGANTION SECTORE
79.		M/D SEID 	HI		2021	0948918794	GREEN AREA 
80.		ADANE FEKADU 	ACCOUNTING 		2019	0921206329	GENERAL SERVICE 
81.		PAL NIANGE 	EDPM		2019	0984420009	SPORT 
82.		NIGAP GACHI TAHC 	SOCIOLOGY 		2019	09678778711	HEALTH 
83.		BEL MALNOTH TOF	GEOLOGIST 		2019	0927777453	BLOCK 
84.		CHANG REK	MANAGEMENT 		2019	0985847192	INFORMATION 
85.		BINIYAM SISAY 	ABAM		2019	0919269295	TEACHING 
86.		ANSEW TADES 	SOCIOLOGY 		2020	0933029384	GENERAL SERVICE 
87.		MOHAMMED AHMED ALI 	RDAE		2021	0906343955	SPORT
88.		ABIS SEYUM 	JOURNALIST 		2019	0982425975	HEALTH 
89.		BRUKE AYYALEW 	IT		2021	09651989413	BLOCK
90.		BEREKET METEKE	M/ENGINEERING 		2022	0900217462	INFORMATION 
91.		HULUNAYEH DESE	EDPM		2019	0989866681	PEACE VALUE ORGANTION SECTORE
92.		MOHAMMED AHMED TESHOM	CIVIL/ENG		2022	0988152996	GREEN AREA
93.		SENBERA AREGA  	ARCHEOLOGY 		2019	94205916	LIBRARY 
94.		WEBNESH YERDAW	ARCHELOGY 		2019	0923747162	GENERAL SERVICE 
95.		YETAYESH ATELEY 	EDPM		2019	0928934508	FINANCE 
96.		YALEMZERF GETENET 	GEOLOGY 		2019	0945191711	WOMEN AFFAIR 
97.		BLEN ESAYAS 	MANAGEMENT 		2019	0941323856	WOMEN AFFAIR
98.		HABIB IMAM 	EDPM		2019	0967683057	HEALTH 
99.		MOHAMMED BELET 	EDPM		2020	0925015554	BLOCK
100.		EBRAHIM TAHIR 			2019	0968419441	INFORMATION 
101.		JEMAL SEID 	MANAGEMENT 		2020	0990146443	TEACHING 
102.		HUSSEN WALQO 	ECONOMIC  		2020	0936620715	PEACE VALUE ORGANTION SECTORE
103.		MOHAMMED HASSEN 	SOCIOLOGY 		2020	0912780361	GREEN AREA 
104.		AHMED  MOHAMMED 	CS		2020	0912611873	LIBRARY 
105.		HABIB MOHAMMED 	GEOLOGY 		2020	0932440030	GENERAL SERVICE 
106.		YOSEF TESFU	TOURISM 		2020	0982109545	SPORT 
107.		MELKAM BASAZEN 	ACCOUNTING 		2020	0928988013	POLICE 
108.		BELET 	JOURNALISM 		2020	0956903512	BLOCK 
109.		RAHMETAYALE	JOURNALISM		2020	0945060820	WOMEN AFFAIR 
110.		MOHAMMED HUSSEN 	SOCIOLOGY 		2020	0952139051	TEACHING 
111.		MOHAMMED AMIN 	SOCIOLOGY 		2020	0967273542	PEACE VALUE ORGANTION SECTORE
112.		MOHAMMED ABDU 	SOCIOLOGY 		2020	0961537574	GREEN AREA 
113.		OUMER ALI 	RDAE		2019	0933692914	LIBRARY 
114.		ABDU MUSSA ABDU 	RDAE		2021	0914140570	GENERAL SERVICE 
115.		SEID YUSUF 	PLANT/C 		2022	0912019105	SPORT 
116.		GURA BALAQTU 	PLANT/C 		2022	0922910997	INFORMATION 
117.		SEADA ABDU 	MEAD /W		2022	0942448441	WOMEN AFFAIR 
118.		TEMARU AYELE 	LOGISTICS 		2019	0954949533	PEACE VALUE ORGANTION SECTORE
119.		FEKADU HAYLU 	NARM 		2022	0945211757	GREEN AREA 
120.		MOHAMMED SANI	NARM 		2019	0928687060	LIBRARY
121.		KEDEST KETEMA 	JOURNALISM 			0911965491	WOMEN AFFAIR 
122.		KEDEST SENTAYHU	JOURNALISM 			0946490662	GENERAL SERVICE 
123.		SEYUM MESFEN 	WATER/EN		2020	0920874267	SPORT 
124.		TADELE ESHETU 	NARM 		2020	0956670768	HEALTH 
125.		MOLGETA SISAY 	NARM		2020	090540271	BLOCK
126.		NUREDIN TARIKU 	IT		2019	0960646760	INFORMATION 
127.		FUAD ENDRIS 	LAW		2020	0929606769	HEALTH 
128.		HAYMANOT HAYLU 	IT 		2019	0952802935	WOMEN AFFAIR 
129.		ANWAR MOHAMMED 	ACCOUNTING 		2020	0945366725	PEACE VALUE ORGANTION SECTORE
130.		ANTENEH KEL;EME 	TOURISM 		2020	0991963225	GREEN AREA 
131.		KELEAB KASAW 	ECONOMICS 		2020	0973625391	GENERAL SERVICE 
132.		ESMAEL TEBEBU	IT		2020	0932453521	SPORT 
133.		ABDULAZIZ GADAFI 	IT		2020	0935048371	HEALTH 
134.		ADEM ALI 	IT 		2020	0933166192	BLOCK
135.		YUHANS BIRESAW 	CS		2020	0924576788	INFO 
136.		EBRAHIM GETAYE 	GEOGRAPHY 		2020	0952290735	PEACE VALUE ORGANTION SECTORE
137.		AHMED ENDRIS 	CS		2020	0941780976	GREEN AREA
138.		SULEYMAN ABDUKADER 	CS		2020	0921933335	LIBRARY 
139.		LUBAK HUSSEN 	CIVIL/ENG 		2020	0924220040	GENERAL SERVICE
140.		MELKAMU TESEMA 	GEOGRAPHY 		2019	0920048264	SPORT
141.		OBSE SODE 			2020	0949765145	HEALTH 
142.		KALKIDAN MANDEFRO 	MARKETING 		2019	0935832691	BLOCK 
143.		BINIOYAM TERUNEH 	ACCOUNTING 		2019	0918644712	INFO 
144.		ADINO ANBOWAHAREY 	VETERINARY		2021	0995787723	TEACHING 
145.		AHAW YUSUF 	MEDICINE 		2022	0911130032	GREEN AREA 
146.		TEZERA BEDADO 	VETERINARY 		2021	0979141447	SPACE POLICE
147.		ABUBOKER EBRAHIM 	COTM		2019	0935174647	PEACE VALUE ORGANTION SECTORE
148.		ABEL TEKEBA 	COTM		2019	0934898561	GENERAL SERVICE 
149.		FOZIYA HUSSEN 	HEALTH 		2019	0914249190	HEALTH 
150.		BESUFKAD TADELE 	ELECTRICAL/EN 		2021	0956999158	BLOCK
151.		BRUKE ALEMU 	RDAE		2020	0946200748	INFO
152.		AHMED MOHAMMED 	ECONOMICS 		2020	0967161596	HEALTH
153.		MUT MAKIYACH 	EDPM		2020	0901790692	GENERAL SERVICE 
154.		AYMEN 	CHEMISTRY 		2020	0987999254	GREEN AREA 
155.		AHMED ABDULQAWI 	IT		2020	0900406444	HEALTH
156.		ASEKER KEMAL   	NARM		2019	0910965717	GENERAL SERVICE 
157.		SAMUEL METEKU 	EDPM		2021	0951928761	GREEN AREA 
158.		MULU GUADE  	LOGISTICS 		2021	0951229295	HEALTH 
159.		ATSEDEGENT 	JOURNALISM 		2021	0904079092	WOMEN AFFAIR 
160.		ZOMA HABITU 	LOGISTICS 		2021	0949952705	TEACHING 
161.		ABDELA OUMER 	RDAE		2019	0901479360	HEALTH 
162.		MOLA MENGESHA 			2020	0963639079	TEACHING 
163.		SISAY AKELE 	TOURISM		2020	0946852412	TEACHING 
164.		BELETE BAHRU 	JOURNALISM 		2020	0903576127	TEACHING 
165.		AREB MOHAMMED AHMED 	SOCIAL SCIENCES		2022	0914487677	GENERAL SERVICE 
166.		UDUM SEKO	EDPM		2019	0923525731	BLOCK
167.		HASSEN AHMED	EDPM		2019	0935414651	SPORT
168.		AYDAHIS M.D 	AGRICULTURE		2022	0983124503	BLOCK
169.		ABO MOHAMMED	MEDICINE 		2024	0936337656	BLOCK
170.		USMAN YASSIN ALI 	LOGISTICS 		2022	0945054443	BLOCK
171.		ADAN MOHAMMED	ANIMAL S		2022	0919811663	BLOCK
172.		ALI UDDO ALI	PHO		2018 	0917572307	HEALTH
173.		NASIR ALI HAMED	PHO		2018 	0911120411	HEALTH
174.		AMARE SOLOMON	JORNALISM		2019	0956519294	SPACE POLICE
175.		MUSSA AHMED	TOURISM		2019	0963648356	BLOCK
176.		BUAY LOK	AGRO BUISNES		2019	0927912198	CAFFE
177.		ABUBEKER ASSEFA	ECONOMICS		2020	0991788995	HEALTH
178.		ADEM M/D ADEM	JORNALISM		2020	0930829860	INFO
179.		FATUMA HASSEN	PRE- ENGINEERING	    	2023	0912972822	BLOCK
180.		AYSHA M/D	MID WIFERY		2022	0926982328	BLOCK`;

const runSeed = async () => {
  try {
    console.log("🌱 Starting seed script...");
    const lines = rawData.split('\n').filter(l => l.trim() !== '');
    
    // Clear existing
    console.log("🧹 Clearing existing members and categories...");
    await pool.query('DELETE FROM members');
    await pool.query('DELETE FROM categories');

    const categoriesSet = new Set();
    const members = [];

    // Parse the TSV-like string
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Values are separated by tabs or multiple spaces.
      // S.N, NAME, DEPARTMENT, ID NUMBER, GRAD YEAR, PHONE, POSITION
      // Since some fields are empty, regex split by 2+ spaces or tabs
      // But wait: "1.   TEWABE MULAT TIRUNEH" means "1." then spaces then "NAME"
      // Let's manually parse.
      
      // regex to parse: number., name, department, id_number, grad_year, phone, position
      // The formatting is highly variable. 
      const parts = line.replace(/^\d+\.\s*/, '').split(/[\t\n]+|  +/).map(p => p.trim()).filter(Boolean);
      
      if (parts.length < 3) continue; // Skip malformed lines

      // The last element is ALWAYS POSITION
      let positionStr = parts.pop().toUpperCase();
      let position = positionStr;
      
      // Standardize positions
      if (positionStr.includes('INFO') || positionStr === 'INFORMATION') position = 'INFORMATION';
      else if (positionStr.includes('LIBRERIY') || positionStr.includes('LIBRARY')) position = 'LIBRARY';
      else if (positionStr.includes('TEACH') || positionStr.includes('TEACHE')) position = 'TEACHING';
      else if (positionStr.includes('PEACE VALUE') || positionStr.includes('ORGANTION')) position = 'PEACE VALUE ORGANIZATION SECTOR';
      else if (positionStr.includes('DISPILEN') || positionStr.includes('DISCIPLINE')) position = 'DISCIPLINE';
      else if (positionStr.includes('WOMEN') || positionStr.includes('AFFAIR')) position = 'WOMEN AFFAIR';
      else if (positionStr.includes('GENERAL SERVICE')) position = 'GENERAL SERVICE';
      else if (positionStr.includes('SPORT')) position = 'SPORT';
      else if (positionStr.includes('HEALTH')) position = 'HEALTH';
      else if (positionStr.includes('BLOCK')) position = 'BLOCK';
      else if (positionStr.includes('FINANCE')) position = 'FINANCE';
      else if (positionStr.includes('LITERARY')) position = 'LITERARY';
      else if (positionStr.includes('POLICE') && !positionStr.includes('SPACE')) position = 'POLICE';
      else if (positionStr.includes('SPACE POLICE')) position = 'SPACE POLICE';
      else if (positionStr.includes('CAFFE')) position = 'CAFFE';
      else if (positionStr.includes('GREEN AREA')) position = 'GREEN AREA';
      else position = 'MEMBER';
      
      categoriesSet.add(position);
      
      // Name is always the first part remaining
      const name = parts.shift();
      
      let department = '';
      let idNumber = '';
      let gradYear = '';
      let phone = '';

      if (parts.length > 0) {
         let last = parts[parts.length - 1];
         if (/^0\d{8,9}$/.test(last) || /^\d{10}$/.test(last) || last.length === 10 || last.startsWith('09')) {
             phone = parts.pop();
         }
      }
      if (parts.length > 0) {
         let last = parts[parts.length - 1];
         if (/^20\d{2}$/.test(last)) {
             gradYear = parts.pop();
         }
      }
      if (parts.length > 0) {
         let last = parts[parts.length - 1];
         if (/^SU/i.test(last) || /^\d+$/.test(last)) {
             idNumber = parts.pop();
         }
      }
      department = parts.join(' ');

      // Standardize departments mapping
      let normDept = department.toUpperCase();
      if (normDept.includes('LOW')) department = 'Law';
      else if (normDept.includes('COTEM')) department = 'COTEM';
      else if (normDept.includes('COTM')) department = 'COTM';
      else if (normDept.includes('P.SCIENCE')) department = 'Political Science';
      else if (normDept.includes('C.SCIENCE') || normDept === 'CS') department = 'Computer Science';
      else if (normDept.includes('MEAD') || normDept.includes('MIDYFERY') || normDept.includes('MID WIFERY')) department = 'Midwifery';
      else if (normDept.includes('V.MEDICEN') || normDept.includes('V.MEDICINE') || normDept.includes('V, MEDICINE') || normDept.includes('VETERINARY')) department = 'Veterinary Medicine';
      else if (normDept.includes('ACCOUNTING') || normDept.includes('ACCOUNTTING') || normDept.includes('ACOUNTING')) department = 'Accounting';
      else if (normDept.includes('MEDICINE')) department = 'Medicine';
      else if (normDept.includes('HI')) department = 'Health Informatics (HI)';
      else if (normDept.includes('NARM')) department = 'Natural Resource Management (NARM)';
      else if (normDept.includes('RDAE') || normDept.includes('RDEA')) department = 'Rural Development (RDAE)';
      else if (normDept.includes('WATER')) department = 'Water Resources Engineering';
      else if (normDept.includes('TOURISM')) department = 'Tourism';
      else if (normDept.includes('SOCIOLOGY')) department = 'Sociology';
      else if (normDept.includes('LOGISTICS') || normDept.includes('LOGISTIC')) department = 'Logistics';
      else if (normDept.includes('MANAGEMENT')) department = 'Management';
      else if (normDept.includes('ECONOMICS') || normDept.includes('ECONOMIC')) department = 'Economics';
      else if (normDept.includes('GEOLOGY') || normDept.includes('GEOLOGIST')) department = 'Geology';
      else if (normDept.includes('GEOGRAPHY')) department = 'Geography';
      else if (normDept.includes('EDPM')) department = 'EDPM';
      else if (normDept.includes('CIVIL')) department = 'Civil Engineering';
      else if (normDept.includes('ELECTRICAL') || normDept.includes('ELECTIRICAL')) department = 'Electrical Engineering';
      else if (normDept.includes('M/ENGINEERING')) department = 'Pre-engineering'; // Fallback
      else if (normDept.includes('PRE- ENGINEERING') || normDept.includes('PRE-ENGINEERING')) department = 'Pre-engineering';
      else if (normDept.includes('PLANT')) department = 'Plant Science';
      else if (normDept.includes('NURSING') || normDept.includes('NURSIN')) department = 'Nursing';
      else if (normDept.includes('JOURNALISM') || normDept.includes('JOURNALIST') || normDept.includes('JORNALISM')) department = 'Journalism';
      else if (normDept.includes('MARKETING')) department = 'Marketing';
      else if (normDept.includes('SOCIAL SCIENCES')) department = 'Social Sciences';
      else if (normDept.includes('AGRO') || normDept.includes('BUISNES')) department = 'Agro Business';
      else if (normDept.includes('AGRICULTURE')) department = 'Agriculture';
      else if (normDept.includes('ANIMAL S')) department = 'Animal Science';
      else if (normDept.includes('PHO')) department = 'Public Health (PHO)';
      else if (normDept.includes('IT') || normDept.includes('ICT')) department = 'Information Technology (IT/ICT)';
      else if (normDept.includes('CHEMISTRY')) department = 'General'; // Doesn't perfectly map
      else if (normDept.includes('ARCHEOLOGY') || normDept.includes('ARCHELOGY')) department = 'Archeology';
      else if (normDept.includes('ABAM')) department = 'ABAM';
      else if (normDept.includes('ABVM')) department = 'ABVM';
      else if (!department) department = 'General';

      // Position logic safely moved above
      
      const email = `member_${i+1}@samu.edu.et`; // placeholder email
      
      members.push({
        name,
        email,
        phone,
        category: position,
        grade: 'Student',
        department,
        id_number: idNumber,
        graduation_year: gradYear,
        position
      });
    }

    // Insert categories
    console.log(`📦 Inserting ${categoriesSet.size} categories...`);
    for (const cat of categoriesSet) {
      await pool.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [cat]);
    }

    // Insert members
    console.log(`👤 Inserting ${members.length} members...`);
    for (const m of members) {
      await pool.query(
        'INSERT INTO members (name, email, phone, category, grade, department, id_number, graduation_year, position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [m.name, m.email, m.phone, m.category, m.grade, m.department, m.id_number, m.graduation_year, m.position]
      );
    }
    
    console.log("✅ Seed completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed Error:", err);
    process.exit(1);
  }
};

runSeed();
