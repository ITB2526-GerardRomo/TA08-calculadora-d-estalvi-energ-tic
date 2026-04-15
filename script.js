// DADES BASE ANUALS (Extretes del document dataclean.pdf)
const DADES_BASE = {
    electricitat: 117857, // kWh anuals
    aigua: 1159825,      // Litres anuals
    oficina: 762,        // Euros anuals
    neteja: 4819.92      // Euros anuals
};

function calcularDades() {
    // 1. Obtenir el nombre de mesos del període introduït per l'usuari
    const mesos = parseInt(document.getElementById('mesos').value);
    
    if(mesos < 1 || mesos > 12) {
        alert("Si us plau, introdueix un període vàlid d'entre 1 i 12 mesos.");
        return;
    }

    // Actualitzar etiquetes de text a l'HTML
    document.querySelectorAll('.num-mesos').forEach(el => el.textContent = mesos);

    // 2. Aplicació d'Estratègies (Variabilitat Estacional)
    // No tots els mesos es gasta igual. Apliquem un factor de "pes" segons el curs.
    // Si són prop de 10 mesos (set-juny), hi ha més pes d'oficina i electricitat (hivern).
    let factorEstacionalitat = mesos / 12;
    let factorElectricitat = factorEstacionalitat * 1.05; // 5% més pel pes de l'hivern lectiu
    let factorAigua = factorEstacionalitat * 0.95; // A l'estiu es gasta més aigua, en lectiu una mica menys en proporció
    
    // VARIABLES DELS 8 CÀLCULS REQUERITS
    // Càlculs 1 i 2: Elèctric
    const elecAny = DADES_BASE.electricitat;
    const elecPer = elecAny * factorElectricitat;

    // Càlculs 3 i 4: Aigua
    const aiguaAny = DADES_BASE.aigua;
    const aiguaPer = aiguaAny * factorAigua;

    // Càlculs 5 i 6: Oficina (Gasto constant lineal)
    const ofiAny = DADES_BASE.oficina;
    const ofiPer = ofiAny * factorEstacionalitat;

    // Càlculs 7 i 8: Neteja (Gasto constant lineal)
    const netAny = DADES_BASE.neteja;
    const netPer = netAny * factorEstacionalitat;

    // 3. Imprimir els 8 càlculs base a l'HTML
    document.getElementById('elec-any').textContent = elecAny.toLocaleString('ca-ES', {maximumFractionDigits: 0});
    document.getElementById('elec-per').textContent = elecPer.toLocaleString('ca-ES', {maximumFractionDigits: 0});
    
    document.getElementById('aigua-any').textContent = aiguaAny.toLocaleString('ca-ES', {maximumFractionDigits: 0});
    document.getElementById('aigua-per').textContent = aiguaPer.toLocaleString('ca-ES', {maximumFractionDigits: 0});
    
    document.getElementById('ofi-any').textContent = ofiAny.toLocaleString('ca-ES', {maximumFractionDigits: 2});
    document.getElementById('ofi-per').textContent = ofiPer.toLocaleString('ca-ES', {maximumFractionDigits: 2});
    
    document.getElementById('net-any').textContent = netAny.toLocaleString('ca-ES', {maximumFractionDigits: 2});
    document.getElementById('net-per').textContent = netPer.toLocaleString('ca-ES', {maximumFractionDigits: 2});

    // 4. PLAN DE REDUCCIÓ DEL 30% EN 3 ANYS (Recàlcul del període seleccionat)
    const factorsReduccio = [0.90, 0.80, 0.70]; // Any 1 (-10%), Any 2 (-20%), Any 3 (-30%)

    // Electricitat
    document.getElementById('elec-y1').textContent = (elecPer * factorsReduccio[0]).toLocaleString('ca-ES', {maximumFractionDigits: 0});
    document.getElementById('elec-y2').textContent = (elecPer * factorsReduccio[1]).toLocaleString('ca-ES', {maximumFractionDigits: 0});
    document.getElementById('elec-y3').textContent = (elecPer * factorsReduccio[2]).toLocaleString('ca-ES', {maximumFractionDigits: 0});

    // Aigua
    document.getElementById('aigua-y1').textContent = (aiguaPer * factorsReduccio[0]).toLocaleString('ca-ES', {maximumFractionDigits: 0});
    document.getElementById('aigua-y2').textContent = (aiguaPer * factorsReduccio[1]).toLocaleString('ca-ES', {maximumFractionDigits: 0});
    document.getElementById('aigua-y3').textContent = (aiguaPer * factorsReduccio[2]).toLocaleString('ca-ES', {maximumFractionDigits: 0});

    // Oficina
    document.getElementById('ofi-y1').textContent = (ofiPer * factorsReduccio[0]).toLocaleString('ca-ES', {maximumFractionDigits: 2});
    document.getElementById('ofi-y2').textContent = (ofiPer * factorsReduccio[1]).toLocaleString('ca-ES', {maximumFractionDigits: 2});
    document.getElementById('ofi-y3').textContent = (ofiPer * factorsReduccio[2]).toLocaleString('ca-ES', {maximumFractionDigits: 2});

    // Neteja
    document.getElementById('net-y1').textContent = (netPer * factorsReduccio[0]).toLocaleString('ca-ES', {maximumFractionDigits: 2});
    document.getElementById('net-y2').textContent = (netPer * factorsReduccio[1]).toLocaleString('ca-ES', {maximumFractionDigits: 2});
    document.getElementById('net-y3').textContent = (netPer * factorsReduccio[2]).toLocaleString('ca-ES', {maximumFractionDigits: 2});

    // Mostrar el panell de resultats
    document.getElementById('resultats').classList.remove('hidden');
}
