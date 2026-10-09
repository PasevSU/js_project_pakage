// ===================================================================================
// ФАЙЛ СЪС СТРУКТУРИРАНИ ДАННИ ЗА ДОКУМЕНТАЦИЯТА
// ===================================================================================
/**
 * Този файл съдържа всички документи за документационния раздел.
 * Структурата е JSON базирана и се използва от load-docs.js за динамично показване.
 * Сега съдържа само български преводи.
 * ===================================================================================
 * 000.07.0 ГЛОБАЛЕН ОБЕКТ С ВСИЧКИ ДОКУМЕНТИ
 * ===================================================================================
 */

window.allDocs = {
  // 000.07.1 МАСИВ С ВСИЧКИ ДОКУМЕНТИ
  "documents": [
    // 000.07.1.1 Документ 1: Списък с add-on хранилища
    {
      "id": "repositories",
      "title": "Списък с add-on хранилища",
      "description": "Пълен списък на полезни add-on хранилища за Home Assistant",
      "content": `
        <div class="repositories-container">
          <div class="repo-item">
            <h3>📦 Add-ons от Alone (HASSCC)</h3>
            <p><strong>Repo:</strong> <a href="https://gitee.com/hasscc/addons" target="_blank" rel="noopener noreferrer">al-one/hasscc-addons</a></p>
            <p><strong>Description:</strong> Колекция от добавки от Alone, включващи различни помощни програми и инструменти.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://gitee.com/hasscc/addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Tobias Glatthar</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/t0bst4r/home-assistant-addons" target="_blank" rel="noopener noreferrer">t0bst4r/home-assistant-addons</a></p>
            <p><strong>Description:</strong> Персонализирани добавки, включително такива за Wake on LAN и мрежови инструменти.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/t0bst4r/home-assistant-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 AlexxIT</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/AlexxIT/hassio-addons" target="_blank" rel="noopener noreferrer">AlexxIT/hassio-addons</a></p>
            <p><strong>Description:</strong> Добавки за поточно видео и камери, включително RTSPtoWeb и HLS поддръжка.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/AlexxIT/hassio-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Bertybuttface</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/bertybuttface/addons" target="_blank" rel="noopener noreferrer">bertybuttface/addons</a></p>
            <p><strong>Description:</strong> Разнообразни добавки, включително мрежово управление и дистанционно управление на устройства.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/bertybuttface/addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 eWeLink (CoolKit-Technologies)</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/CoolKit-Technologies/ha-addon" target="_blank" rel="noopener noreferrer">CoolKit-Technologies/ha-addon</a></p>
            <p><strong>Description:</strong> Официални добавки за интеграция със Sonoff и други eWeLink устройства.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/CoolKit-Technologies/ha-addon" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Example Add-ons</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/home-assistant/addons-example" target="_blank" rel="noopener noreferrer">home-assistant/addons-example</a></p>
            <p><strong>Description:</strong> Шаблон за създаване на собствени Home Assistant добавки – идеален за разработчици.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/home-assistant/addons-example" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Frigate</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/blakeblackshear/frigate-hass-addons" target="_blank" rel="noopener noreferrer">blakeblackshear/frigate-hass-addons</a></p>
            <p><strong>Description:</strong> Добавки за видеонаблюдение с AI (Frigate) – разпознаване на обекти в реално време.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/blakeblackshear/frigate-hass-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Gollum</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/GollumDom/addon-repository" target="_blank" rel="noopener noreferrer">GollumDom/addon-repository</a></p>
            <p><strong>Description:</strong> Добавки, фокусирани върху разширена автоматизация и съвместимост с външни системи.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/GollumDom/addon-repository" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 alexbelgium</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/alexbelgium/hassio-addons" target="_blank" rel="noopener noreferrer">alexbelgium/hassio-addons</a></p>
            <p><strong>Description:</strong> Голямо хранилище с добавки като Jellyfin, FileBrowser, OpenWebUI, Syncthing и др.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/alexbelgium/hassio-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 HAKIT - Dashboard</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/shannonhochkins/ha-component-kit" target="_blank" rel="noopener noreferrer">shannonhochkins/ha-component-kit</a></p>
            <p><strong>Description:</strong> Dashboard компоненти и инструменти за персонализиране на интерфейса на Home Assistant.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/shannonhochkins/ha-component-kit" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 HASS Emulated Hue</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/hass-emulated-hue/hassio-repo" target="_blank" rel="noopener noreferrer">hass-emulated-hue/hassio-repo</a></p>
            <p><strong>Description:</strong> Емулира Hue мост за съвместимост с Alexa/Google Home без реален Hue хъб.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/hass-emulated-hue/hassio-repo" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 einschmidt</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/einschmidt/hassio-addons" target="_blank" rel="noopener noreferrer">einschmidt/hassio-addons</a></p>
            <p><strong>Description:</strong> Добавки като Nextcloud, полезни за лични облачни и системни услуги.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/einschmidt/hassio-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Hass.io Addons от Erik73</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/erik73/hassio-addons" target="_blank" rel="noopener noreferrer">erik73/hassio-addons</a></p>
            <p><strong>Description:</strong> Различни добавки и помощни програми, поддържани от Erik Hilton.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/erik73/hassio-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 dianlight-stable</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/dianlight/hassio-addons" target="_blank" rel="noopener noreferrer">dianlight/hassio-addons</a></p>
            <p><strong>Description:</strong> Стабилна версия на добавки от Dianlight.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/dianlight/hassio-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 dianlight-beta</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/dianlight/hassio-addons-beta" target="_blank" rel="noopener noreferrer">dianlight/hassio-addons-beta</a></p>
            <p><strong>Description:</strong> Бета версия на добавки от Dianlight.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/dianlight/hassio-addons-beta" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Zigbee2MQTT (Koen Kanters)</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/zigbee2mqtt/hassio-zigbee2mqtt" target="_blank" rel="noopener noreferrer">zigbee2mqtt/hassio-zigbee2mqtt</a></p>
            <p><strong>Description:</strong> Официална добавка за Zigbee2MQTT – свързване на Zigbee устройства чрез MQTT брокер.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/zigbee2mqtt/hassio-zigbee2mqtt" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 kevdliu</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/kevdliu/hassio-addon-anylist" target="_blank" rel="noopener noreferrer">kevdliu/hassio-addon-anylist</a></p>
            <p><strong>Description:</strong> Добавка за синхронизация със списъци за пазаруване от приложението AnyList.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/kevdliu/hassio-addon-anylist" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Bigmoby</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/bigmoby/hassio-repository-addon" target="_blank" rel="noopener noreferrer">bigmoby/hassio-repository-addon</a></p>
            <p><strong>Description:</strong> Персонализирани добавки за управление на медия сървъри и IoT устройства.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/bigmoby/hassio-repository-addon" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Home Assistant Add-ons от Alasdair Joyce</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/aegjoyce/ha-addons" target="_blank" rel="noopener noreferrer">aegjoyce/ha-addons</a></p>
            <p><strong>Description:</strong> Колекция от добавки, разработени от Alasdair Joyce.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/aegjoyce/ha-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Home Assistant Developer Add-ons</h3>
            <p><strong>Repo:</strong> <a href="https://developers.home-assistant.io/" target="_blank" rel="noopener noreferrer">home-assistant/developer-addons</a></p>
            <p><strong>Description:</strong> Официални инструменти и ресурси за разработчици за създаване на Home Assistant добавки.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://developers.home-assistant.io/" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 community-edge</h3>
            <p><strong>Repo:</strong> <a href="https://addons.community/edge" target="_blank" rel="noopener noreferrer">addons.community/edge</a></p>
            <p><strong>Description:</strong> Edge версия на обществените добавки.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://addons.community/edge" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Omada</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/jkunczik/home-assistant-omada" target="_blank" rel="noopener noreferrer">jkunczik/home-assistant-omada</a></p>
            <p><strong>Description:</strong> Добавка за TP-Link Omada контролери – мрежов мениджмънт.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/jkunczik/home-assistant-omada" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 GauthamVarmaK</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/GauthamVarmaK/hassio-addons" target="_blank" rel="noopener noreferrer">GauthamVarmaK/hassio-addons</a></p>
            <p><strong>Description:</strong> Добавки, насочени към IoT инфраструктура и сървърни услуги.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/GauthamVarmaK/hassio-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Jellyfin Server</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/mdvorak/ha-addon-jellyfin" target="_blank" rel="noopener noreferrer">mdvorak/ha-addon-jellyfin</a></p>
            <p><strong>Description:</strong> Локален медиен сървър Jellyfin, работещ като Home Assistant добавка.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/mdvorak/ha-addon-jellyfin" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Iframe Home Assistant Addon</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/matte-oss/homeassistant-iframe-proxy-addon/" target="_blank" rel="noopener noreferrer">matte-oss/homeassistant-iframe-proxy-addon</a></p>
            <p><strong>Description:</strong> Iframe proxy добавка за вграждане на външно съдържание в Home Assistant.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/matte-oss/homeassistant-iframe-proxy-addon/" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Mincka</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/mincka/ha-addons" target="_blank" rel="noopener noreferrer">mincka/ha-addons</a></p>
            <p><strong>Description:</strong> Добавки с акцент върху системни и мрежови инструменти.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/mincka/ha-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 poeschl-new</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/Poeschl-HomeAssistant-Addons/repository" target="_blank" rel="noopener noreferrer">Poeschl-HomeAssistant-Addons/repository</a></p>
            <p><strong>Description:</strong> Нова версия на добавки от Poeschl.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/Poeschl-HomeAssistant-Addons/repository" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 poeschl-archived</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/Poeschl/Hassio-Addons" target="_blank" rel="noopener noreferrer">Poeschl/Hassio-Addons</a></p>
            <p><strong>Description:</strong> Архивирана версия на добавки от Poeschl.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/Poeschl/Hassio-Addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Rhasspy</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/rhasspy/hassio-addons" target="_blank" rel="noopener noreferrer">rhasspy/hassio-addons</a></p>
            <p><strong>Description:</strong> Добавки за локален гласов асистент Rhasspy – offline voice control.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/rhasspy/hassio-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 rtl_433</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/pbkhrv/rtl_433-hass-addons" target="_blank" rel="noopener noreferrer">pbkhrv/rtl_433-hass-addons</a></p>
            <p><strong>Description:</strong> Добавки за използване на RF 433 MHz устройства чрез RTL-SDR приемник.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/pbkhrv/rtl_433-hass-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Syncthing Utils</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/BartRuSec/syncthing-utils-ha-addons" target="_blank" rel="noopener noreferrer">BartRuSec/syncthing-utils-ha-addons</a></p>
            <p><strong>Description:</strong> Добавки за поддръжка и автоматизация на Syncthing процеси в HA.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/BartRuSec/syncthing-utils-ha-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 Tom's Add-ons</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/thomasmauerer/hassio-addons" target="_blank" rel="noopener noreferrer">thomasmauerer/hassio-addons</a></p>
            <p><strong>Description:</strong> Разнообразни добавки като Plausible analytics и мрежови интерфейси.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/thomasmauerer/hassio-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 HA Addons от tux2000</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/tux2000/home-assistant-addons" target="_blank" rel="noopener noreferrer">tux2000/home-assistant-addons</a></p>
            <p><strong>Description:</strong> Различни Home Assistant добавки, поддържани от tux2000.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/tux2000/home-assistant-addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 VLC Local</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/rodripf/hassio-local-vlc" target="_blank" rel="noopener noreferrer">rodripf/hassio-local-vlc</a></p>
            <p><strong>Description:</strong> Локален VLC сървър за възпроизвеждане на аудио от Home Assistant.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/rodripf/hassio-local-vlc" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        
          <div class="repo-item">
            <h3>📦 ZigStar</h3>
            <p><strong>Repo:</strong> <a href="https://github.com/mercenaruss/zigstar_addons" target="_blank" rel="noopener noreferrer">mercenaruss/zigstar_addons</a></p>
            <p><strong>Description:</strong> Добавки за работа със ZigStar Zigbee USB адаптери и Zigbee2MQTT.</p>
            <a href="https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https://github.com/mercenaruss/zigstar_addons" target="_blank" rel="noopener noreferrer">
              <img src="https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg" alt="ADD REPO" class="repo-button">
            </a>
          </div>
        </div>
        
        <style>
          .repositories-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-top: 1.5rem;
          }
          
          .repo-item {
            background: white;
            border-radius: 10px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border: 1px solid #e0e0e0;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
          }
          
          .repo-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          }
          
          .repo-item h3 {
            margin-top: 0;
            margin-bottom: 1rem;
            color: var(--primary-color);
            font-size: 1.1rem;
          }
          
          .repo-item p {
            margin: 0.5rem 0;
            line-height: 1.5;
          }
          
          .repo-item strong {
            color: #333;
          }
          
          .repo-item a {
            color: var(--primary-color);
            text-decoration: none;
            font-weight: 500;
          }
          
          .repo-item a:hover {
            text-decoration: underline;
          }
          
          .repo-button {
            display: block;
            margin-top: 1rem;
            max-width: 200px;
            height: auto;
          }
          
          @media (max-width: 768px) {
            .repositories-container {
              grid-template-columns: 1fr;
            }
          }
        </style>
      `,
      "link": "static/doku/repositories.html"
    },
    
    // 000.07.1.2 Документ 2: Видове автоматизации
    {
      "id": "automations",
      "title": "Видове автоматизации",
      "description": "Преглед на различни видове автоматизации и тяхното приложение",
      "content": `
        <main class="doku-main">
          <div class="content-container">
            <div class="description-bar">
              <p class="repo-description">Типът на автоматизацията се определя от секцията \`mode:\` в нейния край.</p>
            </div>

            <div class="markdown-content">
              <!-- Badges Section -->
              <div class="repo-header">
                <div class="badges">
                  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?color=ff00d8" alt="License: MIT">
                  <img src="https://img.shields.io/github/last-commit/Bacard1/homeassistant.svg?color=ff00d8" alt="GitHub last commit">
                  <img src="https://img.shields.io/npm/dm/homeassistant.svg?color=ff00d8" alt="Downloads">
                  <img src="https://img.shields.io/badge/HACS-2025.5.3-orange.svg?color=ff00d8" alt="hacs_badge">
                </div>
                <div class="repo-badges">
                  <img src="https://img.shields.io/badge/.-HOME_ASSISTANT-blue?logo=homeassistant" alt="Home Assistant">
                  <img src="https://img.shields.io/badge/PayPal-DONATE-blue?logo=paypal" alt="Donate via PayPal">
                  <img src="https://img.shields.io/badge/Script-YAML-blue?logo=yaml" alt="Script">
                </div>
                <div class="language-badges">
                  <a href="BG.md" class="lang-badge">
                    <img src="https://img.shields.io/badge/BG-ЕЗИК-green?logo=translate&amp;labelColor=gray&amp;style=flat-square" alt="Български">
                  </a>
                  <a href="DE.md" class="lang-badge">
                    <img src="https://img.shields.io/badge/DE-SPRACHE-green?logo=translate&amp;labelColor=gray&amp;style=flat-square" alt="Deutch">
                  </a>
                  <a href="README.md" class="lang-badge">
                    <img src="https://img.shields.io/badge/EN-LANGUAGE-green?logo=translate&amp;labelColor=gray&amp;style=flat-square" alt="English">
                  </a>
                </div>
              </div>

              <!-- Content will be populated by JavaScript -->
              <div class="automations-container">
                <div class="content-section">
                  <h2>🚀 ВИДОВЕ</h2>
                  
                  <div class="table-container">
                    <table class="automations-table">
                      <thead>
                        <tr>
                          <th>mode</th>
                          <th>Описание</th>
                          <th>Пример за употреба</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>single</code></td>
                          <td>Позволено е само едно изпълнение. Новите тригери се игнорират, докато едно работи.</td>
                          <td>Аларма, която не трябва да се рестартира, докато предишната не завърши.</td>
                        </tr>
                        <tr>
                          <td><code>restart</code></td>
                          <td>Нов тригер прекратява текущото изпълнение и започва от начало.</td>
                          <td>Таймер за светлина – рестартира при ново движение.</td>
                        </tr>
                        <tr>
                          <td><code>queued</code></td>
                          <td>Всеки нов тригер се поставя в опашка и се изпълнява след като предишният завърши.</td>
                          <td>Известия, изпратени до множество потребители последователно.</td>
                        </tr>
                        <tr>
                          <td><code>parallel</code></td>
                          <td>Позволява множество едновременни изпълнения.</td>
                          <td>Включване на светлини в различни стаи независимо.</td>
                        </tr>
                        <tr>
                          <td><code>queued с max:</code></td>
                          <td>Ограничена опашка – позволява до определен брой изчакващи изпълнения.</td>
                          <td>Защита от претоварване в ситуации с бързо задействане.</td>
                        </tr>
                        <tr>
                          <td><code>parallel с max:</code></td>
                          <td>Ограничава броя на едновременните изпълнения.</td>
                          <td>Само определен брой аларми могат да свирят едновременно.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Single Mode Section -->
                <div class="mode-section">
                  <h2>⚗️ single</h2>
                  <div class="diagram-container">
                    <img src="https://raw.githubusercontent.com/PasevSU/homeassistant/main/automations/img/single_diagramm.png" alt="Single mode diagram" class="diagram-image">
                  </div>
                  <p>Диаграмата на режим \`single\` илюстрира най-простото поведение на автоматизация в Home Assistant.</p>
                  
                  <h3>Какво показва диаграмата:</h3>
                  <ul>
                    <li>Тригер 1 — стартира автоматизацията и изпълнява действията.</li>
                    <li>Тригер 2 и 3 — се игнорират, докато автоматизацията все още работи.</li>
                    <li>Няма опашка или паралелизъм — само една активна сесия в даден момент.</li>
                  </ul>
                  
                  <h3>Какво означава на практика:</h3>
                  <ul>
                    <li>Ако автоматизацията вече работи, новите тригери се игнорират.</li>
                    <li>Няма рестартиране, няма опашка, няма паралелно изпълнение.</li>
                    <li>Това избягва претоварване, но може да пропусне важни събития.</li>
                  </ul>
                  
                  <h3>Примерен сценарий:</h3>
                  <pre><code class="language-yaml">alias: "Single Mode Example - Alarm"
description: "Alarm that won't restart until previous completes"
mode: single
trigger:
  - platform: state
    entity_id: binary_sensor.motion
    to: "on"
action:
  - service: alarm_control_panel.alarm_trigger
    target:
      entity_id: alarm_control_panel.house_alarm
  - delay: "00:05:00"  # Wait 5 minutes
  - service: alarm_control_panel.alarm_disarm
    target:
      entity_id: alarm_control_panel.house_alarm</code></pre>
                </div>

                <!-- Restart Mode Section -->
                <div class="mode-section">
                  <h2>⚗️ restart</h2>
                  <div class="diagram-container">
                    <img src="https://raw.githubusercontent.com/PasevSU/homeassistant/main/automations/img/restart_digramm.png" alt="Restart mode diagram" class="diagram-image">
                  </div>
                  
                  <h3>Какво показва диаграмата:</h3>
                  <ul>
                    <li>Тригер стартира автоматизацията.</li>
                    <li>Ако друг тригер дойде преди действията да завършат, текущият цикъл се спира и започва отначало.</li>
                  </ul>
                  
                  <h3>Примерен сценарий:</h3>
                  <pre><code class="language-yaml">alias: "Restart Mode Example - Light Timer"
description: "Light timer that restarts on new motion"
mode: restart
trigger:
  - platform: state
    entity_id: binary_sensor.motion
    to: "on"
action:
  - service: light.turn_on
    target:
      entity_id: light.corridor
  - delay: "00:05:00"  # 5 minutes
  - service: light.turn_off
    target:
      entity_id: light.corridor</code></pre>
                </div>

                <!-- Queued Mode Section -->
                <div class="mode-section">
                  <h2>⚗️ queued</h2>
                  <div class="diagram-container">
                    <img src="https://raw.githubusercontent.com/PasevSU/homeassistant/main/automations/img/queued_diagramm.png" alt="Queued mode diagram" class="diagram-image">
                  </div>
                  
                  <h3>Какво показва диаграмата:</h3>
                  <ul>
                    <li>Всеки нов тригер се поставя в опашка, ако автоматизацията все още работи.</li>
                    <li>Всеки елемент от опашката се изпълнява последователно.</li>
                    <li>\`max:\` определя максималната дължина на опашката.</li>
                  </ul>
                  
                  <h3>Примерен сценарий:</h3>
                  <pre><code class="language-yaml">alias: "Queued Mode Example - Notifications"
description: "Send notifications to users sequentially"
mode: queued
trigger:
  - platform: state
    entity_id: binary_sensor.alert
    to: "on"
action:
  - service: notify.user1
    data:
      message: "Alert notification for User 1"
  - delay: "00:00:10"  # 10 seconds between notifications
  - service: notify.user2
    data:
      message: "Alert notification for User 2"
  - delay: "00:00:10"
  - service: notify.user3
    data:
      message: "Alert notification for User 3"</code></pre>
                </div>

                <!-- Parallel Mode Section -->
                <div class="mode-section">
                  <h2>⚗️ parallel</h2>
                  <div class="diagram-container">
                    <img src="https://raw.githubusercontent.com/PasevSU/homeassistant/main/automations/img/parallel_diagramm.png" alt="Parallel mode diagram" class="diagram-image">
                  </div>
                  
                  <h3>Какво показва диаграмата:</h3>
                  <ul>
                    <li>Всички тригери се изпълняват незабавно паралелно.</li>
                    <li>Няма изчакване или спиране на текущи действия.</li>
                  </ul>
                  
                  <h3>Какво се случва на практика:</h3>
                  <ul>
                    <li>Неограничени изпълнения по подразбиране.</li>
                    <li>Може да претовари системата, ако не се следи.</li>
                  </ul>
                  
                  <h3>Примерен сценарий:</h3>
                  <pre><code class="language-yaml">alias: "Parallel Mode Example - Room Lights"
description: "Turn on lights in different rooms independently"
mode: parallel
trigger:
  - platform: state
    entity_id: binary_sensor.living_room_motion
    to: "on"
  - platform: state
    entity_id: binary_sensor.bedroom_motion
    to: "on"
  - platform: state
    entity_id: binary_sensor.kitchen_motion
    to: "on"
action:
  - choose:
      - conditions: "{{ trigger.entity_id == 'binary_sensor.living_room_motion' }}"
        sequence:
          - service: light.turn_on
            target:
              entity_id: light.living_room
      - conditions: "{{ trigger.entity_id == 'binary_sensor.bedroom_motion' }}"
        sequence:
          - service: light.turn_on
            target:
              entity_id: light.bedroom
      - conditions: "{{ trigger.entity_id == 'binary_sensor.kitchen_motion' }}"
        sequence:
          - service: light.turn_on
            target:
              entity_id: light.kitchen</code></pre>
                </div>

                <!-- Queued with Max Section -->
                <div class="mode-section">
                  <h2>⚗️ queued с max:</h2>
                  <div class="diagram-container">
                    <img src="https://raw.githubusercontent.com/PasevSU/homeassistant/main/automations/img/queued_max_diagramm.png" alt="Queued with max diagram" class="diagram-image">
                  </div>
                  
                  <h3>Как работи:</h3>
                  <p>Ограничена опашка – позволява до определен брой изчакващи изпълнения.</p>
                  
                  <h3>Сценарий:</h3>
                  <p>Защита от претоварване в ситуации с бързо задействане.</p>
                  
                  <pre><code class="language-yaml">alias: "Queued with Max Example - Protection"
description: "Limited queue to prevent overload"
mode: queued
max: 3  # Maximum of 3 waiting executions
trigger:
  - platform: mqtt
    topic: "sensors/rapid_trigger"
action:
  - service: switch.turn_on
    target:
      entity_id: switch.emergency_device
  - delay: "00:01:00"  # 1 minute operation
  - service: switch.turn_off
    target:
      entity_id: switch.emergency_device</code></pre>
                </div>

                <!-- Parallel with Max Section -->
                <div class="mode-section">
                  <h2>⚗️ parallel с max:</h2>
                  <div class="diagram-container">
                    <img src="https://raw.githubusercontent.com/PasevSU/homeassistant/refs/heads/main/automations/img/paralel_max_diagramm.png" alt="Parallel with max diagram" class="diagram-image">
                  </div>
                  
                  <h3>Как работи:</h3>
                  <p>Ограничава броя на едновременните изпълнения.</p>
                  
                  <h3>Сценарий:</h3>
                  <p>Само определен брой аларми могат да свирят едновременно.</p>
                  
                  <pre><code class="language-yaml">alias: "Parallel with Max Example - Limited Alarms"
description: "Only specified number of alarms can play simultaneously"
mode: parallel
max: 2  # Maximum of 2 concurrent executions
trigger:
  - platform: state
    entity_id: binary_sensor.alert_zone_1
    to: "on"
  - platform: state
    entity_id: binary_sensor.alert_zone_2
    to: "on"
  - platform: state
    entity_id: binary_sensor.alert_zone_3
    to: "on"
action:
  - service: media_player.play_media
    target:
      entity_id: media_player.speakers
    data:
      media_content_id: "alarm_sound.mp3"
      media_content_type: "music"
  - delay: "00:00:30"  # Play for 30 seconds
  - service: media_player.media_stop
    target:
      entity_id: media_player.speakers</code></pre>
                </div>
              </div>

              <div class="tip-box">
                <strong>💡 Съвет:</strong>
                <p>Ако ви харесва този проект, вижте <a href="https://github.com/Bacard1?tab=repositories" target="_blank" rel="noopener noreferrer">още от моите репозитории тук</a>.</p>
                <p>Ако имате нужда от помощ или въпроси, не се колебайте да се свържете с мен.</p>
              </div>
            </div>
          </div>
        </main>
        
        <style>
          /* Основни стилове за документацията */
          .doku-main {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
          }
          
          .content-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          
          .description-bar {
            background: linear-gradient(135deg, var(--primary-color), var(--dark-color));
            color: white;
            padding: 1rem 2rem;
            text-align: center;
          }
          
          .repo-description {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 500;
          }
          
          .markdown-content {
            padding: 2rem;
          }
          
          .repo-header {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid #eee;
          }
          
          .badges {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .repo-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-left: auto;
          }
          
          .language-badges {
            display: flex;
            gap: 0.5rem;
          }
          
          .lang-badge {
            display: inline-block;
          }
          
          .automations-container {
            margin-top: 2rem;
          }
          
          .content-section {
            margin-bottom: 3rem;
          }
          
          .table-container {
            overflow-x: auto;
            margin: 1.5rem 0;
          }
          
          .automations-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .automations-table th {
            background: var(--primary-color);
            color: white;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
          }
          
          .automations-table td {
            padding: 1rem;
            border-bottom: 1px solid #eee;
            vertical-align: top;
          }
          
          .automations-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .automations-table tr:hover {
            background-color: #f1f1f1;
          }
          
          .automations-table code {
            background: #f1f1f1;
            color: #d63384;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
          }
          
          .mode-section {
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid #eee;
          }
          
          .mode-section:last-child {
            border-bottom: none;
          }
          
          .mode-section h2 {
            color: var(--primary-color);
            margin-bottom: 1.5rem;
            font-size: 1.8rem;
          }
          
          .mode-section h3 {
            color: #333;
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            font-size: 1.3rem;
          }
          
          .mode-section p {
            margin-bottom: 1rem;
            line-height: 1.6;
          }
          
          .mode-section ul {
            margin-bottom: 1rem;
            padding-left: 1.5rem;
          }
          
          .mode-section li {
            margin-bottom: 0.5rem;
            line-height: 1.5;
          }
          
          .diagram-container {
            text-align: center;
            margin: 2rem 0;
            padding: 1.5rem;
            background: #f8f9fa;
            border-radius: 8px;
          }
          
          .diagram-image {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
            margin: 1rem 0;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.9rem;
          }
          
          pre code {
            background: transparent;
            color: inherit;
            padding: 0;
          }
          
          .tip-box {
            background: linear-gradient(135deg, #fff3cd, #ffeaa7);
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 2rem;
          }
          
          .tip-box strong {
            color: #856404;
            display: block;
            margin-bottom: 0.5rem;
          }
          
          .tip-box a {
            color: var(--primary-color);
            text-decoration: none;
            font-weight: 500;
          }
          
          .tip-box a:hover {
            text-decoration: underline;
          }
          
          /* Отзивчив дизайн */
          @media (max-width: 768px) {
            .markdown-content {
              padding: 1rem;
            }
            
            .repo-header {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .repo-badges {
              margin-left: 0;
            }
            
            .automations-table th,
            .automations-table td {
              padding: 0.5rem;
              font-size: 0.9rem;
            }
            
            pre {
              font-size: 0.8rem;
            }
            
            .diagram-container {
              padding: 1rem;
            }
          }
          
          @media (max-width: 480px) {
            .mode-section h2 {
              font-size: 1.5rem;
            }
            
            .mode-section h3 {
              font-size: 1.2rem;
            }
          }
        </style>
      `,
      "link": "static/doku/automations.html"
    },
    
    // 000.07.1.3 Документ 3: Методи на конфигуриране
    {
      "id": "config-methods",
      "title": "Методи на конфигуриране",
      "description": "Различни начини за конфигуриране на Home Assistant и добавки",
      "content": `
        <main class="doku-main">
          <div class="content-container">
            <div class="description-bar">
              <p class="repo-description">Пълно ръководство за методите на конфигуриране в Home Assistant</p>
            </div>

            <div class="markdown-content">
              <!-- Badges Section -->
              <div class="repo-header">
                <div class="badges">
                  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?color=ff00d8" alt="License: MIT">
                  <img src="https://img.shields.io/github/last-commit/Bacard1/homeassistant.svg?color=ff00d8" alt="GitHub last commit">
                  <img src="https://img.shields.io/npm/dm/homeassistant.svg?color=ff00d8" alt="Downloads">
                  <img src="https://img.shields.io/badge/HACS-2025.5.3-orange.svg?color=ff00d8" alt="hacs_badge">
                </div>
                <div class="repo-badges">
                  <img src="https://img.shields.io/badge/.-HOME_ASSISTANT-blue?logo=homeassistant" alt="Home Assistant">
                  <img src="https://img.shields.io/badge/Configuration-Methods-blue?logo=yaml" alt="Configuration Methods">
                  <img src="https://img.shields.io/badge/Level-Intermediate-blue?logo=academic" alt="Intermediate Level">
                </div>
                <div class="language-badges">
                  <a href="BG.md" class="lang-badge">
                    <img src="https://img.shields.io/badge/BG-ЕЗИК-green?logo=translate&amp;labelColor=gray&amp;style=flat-square" alt="Български">
                  </a>
                  <a href="DE.md" class="lang-badge">
                    <img src="https://img.shields.io/badge/DE-SPRACHE-green?logo=translate&amp;labelColor=gray&amp;style=flat-square" alt="Deutch">
                  </a>
                  <a href="README.md" class="lang-badge">
                    <img src="https://img.shields.io/badge/EN-LANGUAGE-green?logo=translate&amp;labelColor=gray&amp;style=flat-square" alt="English">
                  </a>
                </div>
              </div>

              <!-- Content will be populated by JavaScript -->
              <div class="config-methods-container">
                <!-- Table of Contents -->
                <div class="content-section">
                  <h2>📋 Съдържание</h2>
                  <div class="toc-container">
                    <ul class="toc-list">
                      <li><a href="#introduction">🎯 Въведение</a></li>
                      <li><a href="#directories">📁 Основни директории</a></li>
                      <li><a href="#methods">🔄 Методи на конфигуриране</a></li>
                      <li><a href="#examples">⚡ Практически примери</a></li>
                      <li><a href="#problems">🚨 Често срещани проблеми</a></li>
                      <li><a href="#bestpractices">🏆 Най-добри практики</a></li>
                      <li><a href="#comparison">📊 Сравнителна таблица</a></li>
                      <li><a href="#conclusion">🎯 Заключение</a></li>
                    </ul>
                  </div>
                </div>

                <!-- Introduction -->
                <div class="mode-section" id="introduction">
                  <h2>🎯 Въведение</h2>
                  <p>Home Assistant предлага различни начини за организиране на конфигурацията. Изборът на правилния метод зависи от размера на вашия проект, опита и специфичните нужди.</p>
                </div>

                <!-- Directories -->
                <div class="mode-section" id="directories">
                  <h2>📁 Основни директории</h2>
                  <p>Основна директорна структура за организирана конфигурация:</p>
                  <pre><code class="language-yaml">homeassistant/              # 🏠 Основна директория
├── configuration.yaml      # ⚙️  Главен конфигурационен файл
├── secrets.yaml           # 🔐  Пароли и токени (НИКОГА не се споделя!)
├── customize.yaml         # 🎨  Персонализации на entities
├── automations/           # 🤖  Автоматизации по категории
│   ├── lighting/          # 💡  Автоматизации за светлини
│   ├── security/          # 🚨  Автоматизации за сигурност  
│   └── climate/           # 🌡️  Автоматизации за климатик
├── scripts/               # 📜  Потребителски скриптове
├── scenes/                # 🎭  Сцени (групи от настройки)
├── packages/              # 📦  Пакети - групирани функционалности
│   ├── living_room/       # 🛋️  Всичко за хола
│   ├── kitchen/           # 👨‍🍳 Всичко за кухнята
│   └── notifications/     # 📢  Всичко за известия
└── themes/                # 🎨  Потребителски теми
    ├── dark_theme.yaml    # 🌙  Тъмна тема
    └── light_theme.yaml   # ☀️  Светла тема</code></pre>
                </div>

                <!-- Configuration Methods -->
                <div class="mode-section" id="methods">
                  <h2>🔄 Методи на конфигуриране</h2>
                  
                  <div class="method-item">
                    <h3>📄 \`!include\` - Просто включване</h3>
                    <p><strong>Кога се ползва: За единични големи файлове</strong></p>
                    <pre><code class="language-yaml"># configuration.yaml
customize: !include customize.yaml
rest_command:
  ntfy_notification: !include yaml/ntfy/notification.yaml</code></pre>
                  </div>

                  <div class="method-item">
                    <h3>📂 \`!include_dir_named\` - Включване на директория</h3>
                    <p><strong>Кога се ползва: За множество файлове от един тип</strong></p>
                    <pre><code class="language-yaml"># configuration.yaml
rest_command: !include_dir_named yaml/rest_command
automation: !include_dir_named automations</code></pre>
                  </div>

                  <div class="method-item">
                    <h3>📋 \`!include_dir_merge_list\` - Сливане на списъци</h3>
                    <p><strong>Кога се ползва: За списъци от еднакви обекти</strong></p>
                    <pre><code class="language-yaml"># configuration.yaml
sensor: !include_dir_merge_list sensors
automation: !include_dir_merge_list automations</code></pre>
                  </div>

                  <div class="method-item">
                    <h3>🏷️ \`!include_dir_merge_named\` - Сливане на именувани обекти</h3>
                    <p><strong>Кога се ползва: За именувани колекции като теми</strong></p>
                    <pre><code class="language-yaml"># configuration.yaml
frontend:
  themes: !include_dir_merge_named themes</code></pre>
                  </div>

                  <div class="method-item">
                    <h3>📦 Пакетен подход</h3>
                    <p><strong>Кога се ползва: За функционални групировки</strong></p>
                    <pre><code class="language-yaml"># configuration.yaml
homeassistant:
  packages: !include_dir_named packs</code></pre>
                  </div>
                </div>

                <!-- Practical Examples -->
                <div class="mode-section" id="examples">
                  <h2>⚡ Практически примери</h2>
                  <h3>🔔 NTFY Известия - Различни подходи</h3>
                  
                  <div class="method-item">
                    <h4>📋 Подход 1: Директно в автоматизация (Най-прост)</h4>
                    <pre><code class="language-yaml"># automation.yaml
- alias: "Дверта е отворена"
  trigger:
    platform: state
    entity_id: binary_sensor.front_door
    to: "on"
  action:
    service: notify.ntfy
    data:
      message: "🚪 Предната врата е отворена"
      title: "Сигурност"</code></pre>
                  </div>

                  <div class="method-item">
                    <h4>🛠️ Подход 2: REST Command с \`!include\`</h4>
                    <pre><code class="language-yaml"># configuration.yaml
rest_command:
  ntfy_notification: !include yaml/ntfy/notification.yaml

# yaml/ntfy/notification.yaml  
url: "https://ntfy.sh/home_alerts"
method: POST
payload: "{{ title }} - {{ message }}"</code></pre>
                  </div>

                  <div class="method-item">
                    <h4>📚 Подход 3: REST Command с \`!include_dir_named\`</h4>
                    <pre><code class="language-yaml"># configuration.yaml
rest_command: !include_dir_named yaml/rest_command

# yaml/rest_command/ntfy_security.yaml
security_alert:
  url: "https://ntfy.sh/security"
  method: POST
  headers:
    Priority: "high"
    Tags: "warning"</code></pre>
                  </div>

                  <div class="method-item">
                    <h4>🎨 Подход 4: Шаблон с променливи</h4>
                    <pre><code class="language-yaml"># yaml/ntfy/base_template.yaml
url: "{{ server }}{{ topic }}"
method: "{{ method }}"
headers:
  Title: "{{ title }}"
  Priority: "{{ priority | default('default') }}"
payload: "{{ message }}"

# automation.yaml
- alias: "Температура"
  action:
    service: rest_command.ntfy_notification
    data:
      server: "https://ntfy.sh/"
      topic: "home_alerts"
      title: "🌡️ Висока температура!"
      message: "Температурата е 25°C"</code></pre>
                  </div>

                  <div class="method-item">
                    <h4>📦 Подход 5: Пакетен подход</h4>
                    <pre><code class="language-yaml"># packs/notifications/package.yaml
rest_command:
  ntfy_alert:
    url: "https://ntfy.sh/alerts"
    method: POST
    headers:
      Priority: "high"

automation:
  - alias: "Сигурност - Дверта"
    trigger:
      - platform: state
        entity_id: binary_sensor.front_door
        to: "on"
    action:
      - service: rest_command.ntfy_alert
        data:
          payload: "🚨 Предната врата е отворена!"</code></pre>
                  </div>
                </div>

                <!-- Common Problems -->
                <div class="mode-section" id="problems">
                  <h2>🚨 Често срещани проблеми</h2>
                  
                  <div class="method-item">
                    <h3>❌ Проблем 1: Циркулярни зависимости</h3>
                    <p><strong>🚫 ЛОШО - Безкраен цикъл:</strong></p>
                    <pre><code class="language-yaml"># configuration.yaml
automation: !include automations/main.yaml

# automations/main.yaml  
trigger: !include common/triggers.yaml

# common/triggers.yaml
value_template: !include automations/main.yaml  # ← ГРЕШКА!</code></pre>
                    <p><strong>✅ ДОБРЕ - Независими файлове:</strong></p>
                    <pre><code class="language-yaml"># configuration.yaml
automation: !include_dir_merge_list automations

# automations/security.yaml
- alias: "Сигурност - Дверта"
  trigger:
    platform: state
    entity_id: binary_sensor.door</code></pre>
                  </div>

                  <div class="method-item">
                    <h3>❌ Проблем 2: Грешки при зареждане</h3>
                    <p><strong>🔧 Решение: Тествай файлове индивидуално</strong></p>
                    <pre><code class="language-bash"># Провери цялата конфигурация
hass --script check_config

# Провери конкретна папка  
hass --script check_config --files config/automations/</code></pre>
                  </div>

                  <div class="method-item">
                    <h3>❌ Проблем 3: Сигурност</h3>
                    <p><strong>🔐 Решение: Използвай \`secrets.yaml\`</strong></p>
                    <pre><code class="language-yaml"># secrets.yaml - НИКОГА не комитирай в Git!
ntfy_token: "supersecret123"
api_password: "mypassword123"

# configuration.yaml
rest_command:
  secure_notification:
    headers:
      Authorization: "Bearer !secret ntfy_token"  # ← Безопасно!</code></pre>
                  </div>

                  <div class="method-item">
                    <h3>❌ Проблем 4: Разработка vs Производство</h3>
                    <p><strong>🎭 Решение: Разделни конфигурации</strong></p>
                    <pre><code class="language-yaml"># configuration.yaml
{% if development %}
rest_command: !include_dir_named yaml/rest_command/development
{% else %}
rest_command: !include_dir_named yaml/rest_command/production  
{% endif %}

# yaml/rest_command/development/ntfy.yaml
ntfy_notification:
  url: "https://ntfy.sh/my_test_topic"  # 🧪 Тестов топик

# yaml/rest_command/production/ntfy.yaml  
ntfy_notification:
  url: "https://ntfy.sh/my_real_topic"  # 🚀 Истински топик</code></pre>
                  </div>
                </div>

                <!-- Best Practices -->
                <div class="mode-section" id="bestpractices">
                  <h2>🏆 Най-добри практики</h2>
                  
                  <div class="method-item">
                    <h3>📊 Производителност</h3>
                    <ul>
                      <li>10-50 файла: 🟢 Идеално за \`!include_dir_named\`</li>
                      <li>100+ файла: 🟡 Възможно забавяне</li>
                      <li>1-5 файла: 🔴 Използвай директно в \`configuration.yaml\`</li>
                    </ul>
                  </div>

                  <div class="method-item">
                    <h3>🗂️ Организация</h3>
                    <ul>
                      <li>Именувай файловете описателно</li>
                      <li>Групирай по функционалност</li>
                      <li>Документирай структурата</li>
                    </ul>
                  </div>

                  <div class="method-item">
                    <h3>🔧 Поддръжка</h3>
                    <ul>
                      <li>Правей регулярни бекъпи</li>
                      <li>Тествай промените преди да ги приложиш</li>
                      <li>Използвай version control (Git)</li>
                    </ul>
                  </div>

                  <div class="method-item">
                    <h3>🎯 Препоръки за начинаещи</h3>
                    <ul>
                      <li>Започни с \`!include\` за големи файлове</li>
                      <li>Премини на \`!include_dir_named\` когато имаш много файлове</li>
                      <li>Използвай пакети за функционални групировки</li>
                      <li>Шаблони - само за повтарящ се код</li>
                    </ul>
                  </div>
                </div>

                <!-- Comparison Table -->
                <div class="mode-section" id="comparison">
                  <h2>📊 Сравнителна таблица</h2>
                  
                  <div class="table-container">
                    <table class="automations-table">
                      <thead>
                        <tr>
                          <th>Метод</th>
                          <th>🎯 Кога се ползва?</th>
                          <th>✅ Предимства</th>
                          <th>❌ Недостатки</th>
                          <th>📝 Пример</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>!include</code></td>
                          <td>Малки проекти, единични файлове</td>
                          <td>🟢 Прост, лесен за разбиране</td>
                          <td>🔴 Не мащабируем</td>
                          <td><code>customize: !include customize.yaml</code></td>
                        </tr>
                        <tr>
                          <td><code>!include_dir_named</code></td>
                          <td>Големи проекти, много файлове</td>
                          <td>🟢 Добра организация, мащабируем</td>
                          <td>🟡 По-сложен</td>
                          <td><code>rest_command: !include_dir_named yaml/rest_command</code></td>
                        </tr>
                        <tr>
                          <td><code>!include_dir_merge_list</code></td>
                          <td>Списъци от еднакви обекти</td>
                          <td>🟢 Автоматично сливане на списъци</td>
                          <td>🔴 Трябва да са един тип</td>
                          <td><code>sensor: !include_dir_merge_list sensors</code></td>
                        </tr>
                        <tr>
                          <td><code>!include_dir_merge_named</code></td>
                          <td>Именувани колекции</td>
                          <td>🟢 Автоматично сливане на именувани обекти</td>
                          <td>🟡 Специфична употреба</td>
                          <td><code>themes: !include_dir_merge_named themes</code></td>
                        </tr>
                        <tr>
                          <td><code>📦 Пакети</code></td>
                          <td>Функционални групировки</td>
                          <td>🟢 Всичко на едно място, изолирани функции</td>
                          <td>🟡 Може да стане прекалено голям</td>
                          <td><code>packages: !include_dir_named packs</code></td>
                        </tr>
                        <tr>
                          <td><code>🎨 Шаблони</code></td>
                          <td>Повтаряща се конфигурация</td>
                          <td>🟢 Избягва повторение на код, централизиране</td>
                          <td>🔴 По-сложни за дебъгване</td>
                          <td><code>rest_command: !include yaml/ntfy/template.yaml</code></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Conclusion -->
                <div class="mode-section" id="conclusion">
                  <h2>🎯 Заключение</h2>
                  <p>Изборът на конфигурационен метод зависи от:</p>
                  <ul>
                    <li>📏 Размер на проекта - малки → прости, големи → структурирани</li>
                    <li>👤 Вашият опит - започни просто, усложнявай постепенно</li>
                    <li>👥 Екипна работа - структурирани подходи са по-добри за екипи</li>
                    <li>🔄 Честота на промени - често променяни конфигурации се възползват от разделяне</li>
                  </ul>
                  <p><strong>🏁 Запомни: Най-добрата конфигурация е тази, която можеш лесно да поддържаш и разбираш!</strong></p>
                </div>
              </div>

              <div class="tip-box">
                <strong>💡 Съвет:</strong>
                <p>Ако ви харесва този проект, вижте <a href="https://github.com/Bacard1?tab=repositories" target="_blank" rel="noopener noreferrer">още от моите репозитории тук</a>.</p>
                <p>Ако имате нужда от помощ или въпроси, не се колебайте да се свържете с мен.</p>
              </div>
            </div>
          </div>
        </main>
        
        <style>
          /* Стилове за документацията */
          .doku-main {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem 1rem;
          }
          
          .content-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          
          .description-bar {
            background: linear-gradient(135deg, var(--primary-color), var(--dark-color));
            color: white;
            padding: 1rem 2rem;
            text-align: center;
          }
          
          .repo-description {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 500;
          }
          
          .markdown-content {
            padding: 2rem;
          }
          
          .repo-header {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid #eee;
          }
          
          .badges {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .repo-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-left: auto;
          }
          
          .language-badges {
            display: flex;
            gap: 0.5rem;
          }
          
          .lang-badge {
            display: inline-block;
          }
          
          .content-section {
            margin-bottom: 2rem;
          }
          
          .toc-container {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 1rem;
          }
          
          .toc-list {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .toc-list li {
            margin-bottom: 0.75rem;
          }
          
          .toc-list a {
            color: var(--primary-color);
            text-decoration: none;
            font-weight: 500;
            display: block;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            transition: background-color 0.3s;
          }
          
          .toc-list a:hover {
            background-color: rgba(65, 189, 245, 0.1);
            text-decoration: none;
          }
          
          .mode-section {
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid #eee;
          }
          
          .mode-section:last-child {
            border-bottom: none;
          }
          
          .mode-section h2 {
            color: var(--primary-color);
            margin-bottom: 1.5rem;
            font-size: 1.8rem;
          }
          
          .method-item {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid var(--primary-color);
          }
          
          .method-item h3,
          .method-item h4 {
            color: #333;
            margin-top: 0;
          }
          
          .method-item h4 {
            color: var(--primary-color);
            font-size: 1.2rem;
          }
          
          pre {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 1rem;
            border-radius: 5px;
            overflow-x: auto;
            margin: 1rem 0;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.9rem;
          }
          
          code {
            background: #f1f1f1;
            color: #d63384;
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
          }
          
          pre code {
            background: transparent;
            color: inherit;
            padding: 0;
          }
          
          .table-container {
            overflow-x: auto;
            margin: 1.5rem 0;
          }
          
          .automations-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .automations-table th {
            background: var(--primary-color);
            color: white;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
          }
          
          .automations-table td {
            padding: 1rem;
            border-bottom: 1px solid #eee;
          }
          
          .automations-table tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          
          .automations-table tr:hover {
            background-color: #f1f1f1;
          }
          
          .tip-box {
            background: linear-gradient(135deg, #fff3cd, #ffeaa7);
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 1.5rem;
            margin-top: 2rem;
          }
          
          .tip-box strong {
            color: #856404;
            display: block;
            margin-bottom: 0.5rem;
          }
          
          .tip-box a {
            color: var(--primary-color);
            text-decoration: none;
            font-weight: 500;
          }
          
          .tip-box a:hover {
            text-decoration: underline;
          }
          
          /* Отзивчив дизайн */
          @media (max-width: 768px) {
            .markdown-content {
              padding: 1rem;
            }
            
            .repo-header {
              flex-direction: column;
              align-items: flex-start;
            }
            
            .repo-badges {
              margin-left: 0;
            }
            
            .automations-table th,
            .automations-table td {
              padding: 0.5rem;
              font-size: 0.9rem;
            }
            
            pre {
              font-size: 0.8rem;
            }
          }
        </style>
      `,
      "link": "static/doku/config_methods.html"
    }
  ]
};