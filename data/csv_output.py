##make dictionaries for all columns
import csv
import json
import collections

years = {}
counties = {}
jurisdictions = {}
types = {}
statuses = {}
nozip = 0
okzip = 0
nyc=0
zips = {}
statusDesDict = {}
statusDict = {}
jurisdictionDict={}
stateTally = 0
nycCounties = ["BRONX", "KINGS", "NEW YORK", "QUEENS", "RICHMOND"]
nycZips_post =["11201", "11202", "11203", "11204", "11205", "11206", "11207", "11208", "11209", "11210", "11211", "11212", "11213", "11214", "11215", "11216", "11217", "11218", "11219", "11220", "11221", "11222", "11223", "11224", "11225", "11226", "11228", "11229", "11230", "11231", "11232", "11233", "11234", "11235", "11236", "11237", "11238", "11239", "11240", "11241", "11242", "11243", "11244", "11245", "11247", "11248", "11249", "11251", "11252", "11254", "11255", "11256", "10001", "10002", "10003", "10004", "10005", "10006", "10007", "10008", "10009", "10010", "10011", "10012", "10013", "10014", "10015", "10016", "10017", "10018", "10019", "10020", "10021", "10022", "10023", "10024", "10025", "10026", "10027", "10028", "10029", "10030", "10031", "10032", "10033", "10034", "10035", "10036", "10037", "10038", "10039", "10040", "10041", "10043", "10044", "10045", "10046", "10047", "10048", "10055", "10060", "10065", "10069", "10072", "10075", "10079", "10080", "10081", "10082", "10087", "10090", "10094", "10095", "10096", "10098", "10099", "10101", "10102", "10103", "10104", "10105", "10106", "10107", "10108", "10109", "10110", "10111", "10112", "10113", "10114", "10115", "10116", "10117", "10118", "10119", "10120", "10121", "10122", "10123", "10124", "10125", "10126", "10128", "10129", "10130", "10131", "10132", "10133", "10138", "10149", "10150", "10151", "10152", "10153", "10154", "10155", "10156", "10157", "10158", "10159", "10160", "10161", "10162", "10163", "10164", "10165", "10166", "10167", "10168", "10169", "10170", "10171", "10172", "10173", "10174", "10175", "10176", "10177", "10178", "10179", "10184", "10185", "10196", "10197", "10199", "10203", "10211", "10212", "10213", "10242", "10249", "10256", "10257", "10258", "10259", "10260", "10261", "10265", "10268", "10269", "10270", "10271", "10272", "10273", "10274", "10275", "10276", "10277", "10278", "10279", "10280", "10281", "10282", "10285", "10286", "10292", "11692", "11102", "11103", "11105", "11106", "11359", "11360", "11361", "11426", "11697", "11411", "11356", "11368", "11369", "11370", "11373", "11380", "11690", "11691", "11693", "11695", "11002", "11005", "11351", "11352", "11354", "11355", "11358", "11367", "11371", "11381", "11390", "11375", "11365", "11366", "11004", "11423", "11414", "11372", "11405", "11424", "11425", "11430", "11431", "11432", "11433", "11434", "11435", "11436", "11439", "11451", "11499", "11415", "11362", "11363", "11101", "11109", "11120", "11378", "11379", "11364", "11416", "11417", "11427", "11428", "11429", "11374", "11418", "11385", "11386", "11694", "11422", "11412", "11420", "11419", "11413", "11104", "11357", "11421", "11377", "10301", "10302", "10303", "10304", "10305", "10306", "10307", "10308", "10309", "10310", "10311", "10312", "10313", "10314", "10451", "10452", "10453", "10454", "10455", "10456", "10457", "10458", "10459", "10460", "10461", "10462", "10463", "10464", "10465", "10466", "10467", "10468", "10469", "10470", "10471", "10472", "10473", "10474", "10475", "10499"]
##using following zipcodes from geojson file!!!!
nycZips_geo =["11372","11004","11040","11426","11365","11373","11001","11375","11427","11374","11366","11423","11428","11432","11379","11429","11435","11415","11418","11433","11451","11221","11421","11419","11434","11216","11416","11233","11436","11213","11212","11225","11218","11226","11219","11210","11230","11204","10471","10470","10466","10467","10463","10475","10464","10469","10468","10463","10458","10034","10033","10462","10040","10453","10465","10464","10464","10461","10457","10460","10032","10452","10456","10472","10031","10039","10459","10451","10473","10030","10027","10474","10455","10037","10024","10454","10026","10035","10025","10035","11357","10029","00083","11356","11359","11360","11105","10128","11371","10023","11363","10028","11354","11102","11370","10021","11361","11358","11362","10044","11369","11103","11106","11368","11377","10036","11355","11101","11364","10018","10020","11005","10017","10001","10011","10016","11104","11109","10010","11367","10014","10003","11222","10002","11378","10009","10012","10013","11211","10007","11237","11385","10038","11206","10006","11412","10005","11251","10004","11411","11201","10004","11205","11208","11207","10004","10004","11413","11217","11238","11231","11422","11420","11417","11215","11414","11231","11232","11430","11203","11239","11236","11220","10301","10310","10303","11234","10302","11693","11209","10304","10314","11693","11228","11096","10305","11229","11214","11691","11096","11223","11693","11692","11235","11693","10306","11694","11224","10308","11697","10312","10309","10307","10280","10048","10279","10165","10168","10055","10105","10118","10176","10162","10019","10111","10170","10112","10122","10107","10103","10153","10174","10166","10169","10167","10177","10172","10171","10154","10152","10270","10104","10271","10110","10175","10151","10173","10178","10119","10121","10115","10123","10106","10158","10041","10120","10278","10155","10022","10043","10081","10096","10097","10196","10196","10275","10265","10045","10047","10047","10080","10203","10259","10260","10285","10286","11370","10065","10075","10069","10281","10282"]
states = ["DISTRICT OF COLUMBIA","ALABAMA", "ALASKA", "ARIZONA", "ARKANSAS", "CALIFORNIA", "COLORADO", "CONNECTICUT", "DELAWARE", "FLORIDA", "GEORGIA", "HAWAII", "IDAHO", "ILLINOIS", "INDIANA", "IOWA", "KANSAS", "KENTUCKY", "LOUISIANA", "MAINE", "MARYLAND", "MASSACHUSETTS", "MICHIGAN", "MINNESOTA", "MISSISSIPPI", "MISSOURI", "MONTANA", "NEBRASKA", "NEVADA", "NEW HAMPSHIRE", "NEW JERSEY", "NEW MEXICO", "NEW YORK", "NORTH CAROLINA", "NORTH DAKOTA", "OHIO", "OKLAHOMA", "OREGON", "PENNSYLVANIA", "RHODE ISLAND", "SOUTH CAROLINA", "SOUTH DAKOTA", "TENNESSEE", "TEXAS", "UTAH", "VERMONT", "VIRGINIA", "WASHINGTON", "WEST VIRGINIA", "WISCONSIN", "WYOMING"]
countries_geo=["BAHAMAS, THE","KOREA,SOUTH","KOREA, NORTH","UNITED KINGDOM","AFGHANISTAN","ALBANIA","ALGERIA","SAMOA","ANDORRA","ANGOLA","ANTIGUA AND BARBUDA","AZERBAIJAN","ARGENTINA","AUSTRALIA","AUSTRIA","BAHRAIN","BANGLADESH","ARMENIA","BARBADOS","BELGIUM","BERMUDA","BHUTAN","BOLIVIA","BOSNIA AND HERZEGOVINA","BOTSWANA","BOUVET ISLAND","BRAZIL","BELIZE","BRITISH INDIAN OCEAN TERRITORY","SOLOMON ISLANDS","BRITISH VIRGIN ISLANDS","BRUNEI","BULGARIA","BURMA","BURUNDI","BELARUS","CAMBODIA","CAMEROON","CANADA","CAPE VERDE","CAYMAN ISLANDS","CENTRAL AFRICAN REPUBLIC","SRI LANKA","CHAD","CHILE","CHINA","TAIWAN","CHRISTMAS ISLAND","COCOS (KEELING) ISLANDS","COLOMBIA","COMOROS","MAYOTTE","COOK ISLANDS","COSTA RICA","CROATIA","CUBA","CYPRUS","CZECH REPUBLIC","BENIN","DENMARK","DOMINICA","DOMINICAN REPUBLIC","ECUADOR","EL SALVADOR","EQUATORIAL GUINEA","ETHIOPIA","ERITREA","ESTONIA","FAROE ISLANDS","FALKLAND ISLANDS (ISLAS MALVINAS)","SOUTH GEORGIA SOUTH SANDWICH ISLANDS","FIJI","FINLAND","ALAND ISLANDS","FRANCE","FRENCH GUIANA","FRENCH POLYNESIA","FRENCH SOUTHERN AND ANTARCTIC LANDS","DJIBOUTI","GABON","GEORGIA","PALESTINE","GERMANY","GHANA","GIBRALTAR","KIRIBATI","GREECE","GREENLAND","GRENADA","GUADELOUPE","GUAM","GUATEMALA","GUINEA","GUYANA","HAITI","HEARD ISLAND AND MCDONALD ISLANDS","HOLY SEE (VATICAN CITY)","HONDURAS","HONG KONG","HUNGARY","ICELAND","INDIA","INDONESIA","IRAN","IRAQ","IRELAND","ISRAEL","ITALY","COTE D'IVOIRE","JAMAICA","JAPAN","KAZAKHSTAN","JORDAN","KENYA","KUWAIT","KYRGYZSTAN","LAOS","LEBANON","LESOTHO","LATVIA","LIBERIA","LIBYA","LIECHTENSTEIN","LITHUANIA","LUXEMBOURG","MACAU","MADAGASCAR","MALAWI","MALAYSIA","MALDIVES","MALI","MALTA","MARTINIQUE","MAURITANIA","MAURITIUS","MEXICO","MONACO","MONGOLIA","MOLDOVA","MONTENEGRO","MONTSERRAT","MOROCCO","MOZAMBIQUE","OMAN","NAMIBIA","NAURU","NEPAL","NETHERLANDS","NETHERLANDS ANTILLES","ARUBA","NEW CALEDONIA","VANUATU","NEW ZEALAND","NICARAGUA","NIGER","NIGERIA","NIUE","NORFOLK ISLAND","NORWAY","NORTHERN MARIANA ISLANDS","MARSHALL ISLANDS","PALAU","PAKISTAN","PANAMA","PAPUA NEW GUINEA","PARAGUAY","PERU","PHILIPPINES","PITCAIRN ISLANDS","POLAND","PORTUGAL","GUINEA-BISSAU","TIMOR-LESTE","PUERTO RICO","QATAR","REUNION","ROMANIA","RUSSIA","RWANDA","SAINT BARTHELEMY","SAINT HELENA","SAINT KITTS AND NEVIS","ANGUILLA","SAINT LUCIA","SAINT MARTIN","SAINT PIERRE AND MIQUELON","SAINT VINCENT AND THE GRENADINES","SAN MARINO","SAO TOME AND PRINCIPE","SAUDI ARABIA","SENEGAL","SERBIA","SEYCHELLES","SIERRA LEONE","SINGAPORE","SLOVAKIA","VIETNAM","SLOVENIA","SOMALIA","SOUTH AFRICA","ZIMBABWE","SPAIN","WESTERN SAHARA","SUDAN","SURINAME","SVALBARD","SWAZILAND","SWEDEN","SWITZERLAND","SYRIA","TAJIKISTAN","THAILAND","TOGO","TOKELAU","TONGA","TRINIDAD AND TOBAGO","UNITED ARAB EMIRATES","TUNISIA","TURKEY","TURKMENISTAN","TURKS AND CAICOS ISLANDS","TUVALU","UGANDA","UKRAINE","MACEDONIA","EGYPT","UNITED KINGDOM","GUERNSEY","JERSEY","ISLE OF MAN","TANZANIA","UNITED STATES","VIRGIN ISLANDS","BURKINA FASO","URUGUAY","UZBEKISTAN","VENEZUELA","WALLIS AND FUTUNA","SAMOA","YEMEN","ZAMBIA"]
noJ = 0

undefined_geo =  ['YUGOSLAVIA','CHANNEL ISLANDS','ARMED SERVICES AMERICAS','AFRICA','ALL OTHERS']
with open('nyc_world_06232014.csv', 'wb') as newcsvfile:

#with open('nyc_all_06232014.csv', 'wb') as newcsvfile:
    spamwriter = csv.writer(newcsvfile)
    spamwriter.writerow(["name", "jurisdiction", "jurisdictionType", "entityType", "status", "statusDescription", "birthyear", "birthmonth", "birthday", "deathyear", "deathmonth", "deathday", "zipcode"])

    with open('CorporationsData_Original.csv', 'rb') as csvfile:
        spamreader = csv.reader(csvfile)
        next(spamreader, None)
        for row in spamreader:
            county = row[7]
            name = row[0]

            birth = row[8]
            if birth !="":
                birth = row[8].split("-")
                birthyear =  birth[0]
                birthmonth =   birth[1]
                birthday =  birth[2]
               # print birthyear, birthmonth, birthday
                
            else:
                birth =""
            
            jurisdiction =  row[2]
            entityType = row[3]
            status = row[4]
            statusDescription = row[5]   
            death = row[6]     
            if status != "ACTIVE":
                if death !="":
                    death = row[6].split("-")
                    deathyear = death[0]
                    deathmonth = death[1]
                    deathday = death[2]
                    #print "death", deathyear, deathmonth, deathday
            else:
                death = "NONE"
                deathyear = "NONE"
                deathmonth = "NONE"
                deathday = "NONE"
                statusDescription = "NONE"     
                
            address=row[9]
            #print address
            zipcode = row[9].split(" ")[-1]
            zipcode = zipcode.split("-")[0]
            
            if jurisdiction == "EAST GERMANY" or jurisdiction == "WEST GERMANY":
                jurisdiction = "GERMANY"
            if jurisdiction == "SCOTLAND" or jurisdiction == "ENGLAND" or jurisdiction == "ENGLAND-WALES" or jurisdiction == "WALES" or jurisdiction == "NORTHERN IRELAND":
                jurisdiction = "UNITED KINGDOM"          
            if jurisdiction == "US VIRGIN ISLANDS":
                jurisdiction = "VIRGIN ISLANDS"
            if jurisdiction == "SOVIET UNION":
                jurisdiction = "RUSSIA"
            if jurisdiction == "SIKKIM":
                jurisdiction = "INDIA"
            if jurisdiction == "BRITISH COLUMBIA" or jurisdiction =="NUNAVUT" or jurisdiction == "PRINCE EDWARD ISLAND" or jurisdiction =="SASKATCHEWAN" or jurisdiction == "NEW BRUNSWICK" or jurisdiction == "ALBERTA" or jurisdiction == "NOVA SCOTIA" or jurisdiction == "QUEBEC" or jurisdiction == "ONTARIO":
                jurisdiction = "CANADA"
            if jurisdiction == "KOREA":
                jurisdiction = "KOREA,SOUTH"
            if jurisdiction ==  'REPUBLIC OF SLOVENIA':
                jurisdiction =  'SLOVENIA'
            if jurisdiction == "CZECHOSLOVAKIA":
                jurisdiction = "CZECH REPUBLIC"
            if jurisdiction == "MARIANA ISLANDS":     
                jurisdiction = "NORTHERN MARIANA ISLANDS"
            if jurisdiction == "BAHAMA ISLANDS":
                jurisdiction = "BAHAMAS, THE"
            if jurisdiction == "UPPER VOLTA":
                jurisdiction = "BURKINA FASO"
            if jurisdiction == "IVORY COAST":   
                jurisdiction = "COTE D'IVOIRE"
            if jurisdiction == "WESTERN SOMOA":
                jurisdiction = "SAMOA"
            if jurisdiction == "ANTIGUA":
                jurisdiction = "ANTIGUA AND BARBUDA"
            if jurisdiction == "WEST INDIES":
                jurisdiction = "NETHERLANDS ANTILLES"
            
            
            
            
            if name !="" and jurisdiction !="" and status !="" and birth !="" and address !="":
                if zipcode in nycZips_geo:
                   # nyc +=1
                    #jurisdictionDict[jurisdiction] = jurisdictionDict.get(jurisdiction,0)+1
                    if jurisdiction in states:
                        jurisdictionType = "US"
                        #spamwriter.writerow([name, jurisdiction, jurisdictionType, entityType, status, statusDescription, birthyear, birthmonth, birthday, deathyear, deathmonth, deathday, zipcode])
                        
                    elif jurisdiction in countries_geo:
                        jurisdictionType = "world"
                        spamwriter.writerow([name, jurisdiction, jurisdictionType, entityType, status, statusDescription, birthyear,birthmonth, birthday, deathyear,deathmonth,deathday, zipcode])
                        
                    else:
                       # print jurisdiction
                       
                       jurisdictionDict[jurisdiction] = jurisdictionDict.get(jurisdiction,0)+1
                        
               
#print "nyc", nyc
#print stateTally*100.00/nyc
#print sorted(jurisdictionDict.items(), key=lambda x:x[1])
 
#print "nozip", nozip
#print "yeszip", okzip
#print "all", nyc
#print nozip*100.00/nyc  
#print okzip*100.00/nyc  
#
#print zips    
#print sorted(zips.items(), key=lambda x:x[1])
 
#            if "DOMESTIC" in entityType and county in nycCounties:
#                if jurisdiction == "GEORGIA":
 #                   print "state"
                
 #           elif "FOREIGN" in entityType and county in nycCounties:
 #               if jurisdiction == "GEORGIA":
 #                   print county              
#            if "NOT-FOR-PROFIT" in entityType:
 #           if "NOT-FOR-PROFIT" in entityType and county in nycCounties:
        


#print years
#print statuses
#print types
#print counties
#print jurisdictions
#print sorted(years.items(), key=lambda x:x[1])
