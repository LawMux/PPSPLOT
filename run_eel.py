'''
(C) 2025 James Skelley
GNU AFFERO GENERAL PUBLIC LICENSE (with disclaimer addition)

See top-level LICENSE file for terms.

For clarity, in accordance with Item 16 of the AGPL, THIS SOFTWARE IS PROVIDED 
BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, 
INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS 
FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR 
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY,
OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE 
GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) 
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
'''

import eel
from random import randint
import requests
import datetime
import os
import json
import db_tools
import glob

eel.init("web")

@eel.expose
def retrieve_groups():
    groups = {}
    for f in glob.glob('./repo_csvs/*.csv'):
        groups[os.path.basename(f)[:-4]] = db_tools.process_csv(f)
    #print(groups)
    return groups


eel.start("dashboard.htm", port=8080)
